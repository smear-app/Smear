/**
 * Invocable action for Agentforce — Topic 2 (Coaching context).
 *
 * Upserts a Climber__c record by Smear_User_Id__c. Creates the record if it
 * doesn't exist yet (first time a climber sets a goal), otherwise updates it.
 *
 * Used in two ways:
 *   - Climber sets their own goal grade via the agent chat
 *   - Agent writes back an updated Training_Focus__c after synthesizing performance data
 *
 * Bulkified: upsert runs on a collected list, not record by record.
 */
public with sharing class UpsertClimberGoal {

    public class Request {
        @InvocableVariable(label='Smear User ID' description='Supabase UUID from the climber\'s Smear account' required=true)
        public String smearUserId;

        @InvocableVariable(label='Climber Name' description='Display name for the Salesforce record')
        public String climberName;

        @InvocableVariable(label='Goal Grade (V-scale value)' description='Target grade; leave null to keep existing value')
        public Decimal goalGrade;

        @InvocableVariable(label='Training Focus' description='Agent-set focus area; leave null to keep existing value')
        public String trainingFocus;
    }

    public class UpsertResult {
        @InvocableVariable(label='Climber Record ID')
        public Id climberId;

        @InvocableVariable(label='Was Created')
        public Boolean wasCreated;

        @InvocableVariable(label='Error Message')
        public String errorMessage;
    }

    @InvocableMethod(
        label='Upsert Climber Goal'
        description='Creates or updates a climber\'s goal grade and training focus in Salesforce by their Smear user ID.'
        category='Smear Coaching'
    )
    public static List<UpsertResult> upsertGoal(List<Request> requests) {
        List<UpsertResult> results = new List<UpsertResult>();

        // Fetch existing records to decide create vs. update
        Set<String> userIds = new Set<String>();
        for (Request req : requests) {
            if (req.smearUserId != null) userIds.add(req.smearUserId);
        }

        Map<String, Climber__c> existing = new Map<String, Climber__c>();
        for (Climber__c c : [
            SELECT Id, Smear_User_Id__c, Goal_Grade__c, Training_Focus__c
            FROM Climber__c
            WHERE Smear_User_Id__c IN :userIds
        ]) {
            existing.put(c.Smear_User_Id__c, c);
        }

        List<Climber__c> toUpsert = new List<Climber__c>();
        Map<Integer, Boolean> wasCreatedByIndex = new Map<Integer, Boolean>();

        for (Integer i = 0; i < requests.size(); i++) {
            Request req = requests[i];
            Climber__c c = existing.containsKey(req.smearUserId)
                ? existing.get(req.smearUserId)
                : new Climber__c(Smear_User_Id__c = req.smearUserId);

            wasCreatedByIndex.put(i, c.Id == null);

            if (req.climberName != null) c.Name = req.climberName;
            if (req.goalGrade != null) c.Goal_Grade__c = req.goalGrade;
            if (req.trainingFocus != null) c.Training_Focus__c = req.trainingFocus;

            toUpsert.add(c);
        }

        Database.UpsertResult[] dbResults = Database.upsert(toUpsert, Climber__c.Smear_User_Id__c, false);

        for (Integer i = 0; i < dbResults.size(); i++) {
            UpsertResult result = new UpsertResult();
            if (dbResults[i].isSuccess()) {
                result.climberId = dbResults[i].getId();
                result.wasCreated = wasCreatedByIndex.get(i);
            } else {
                result.errorMessage = dbResults[i].getErrors()[0].getMessage();
            }
            results.add(result);
        }

        return results;
    }
}
