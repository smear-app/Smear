/**
 * Invocable action for Agentforce — Topic 2 (Coaching context).
 *
 * Reads a climber's goal grade and agent-set training focus from Climber__c.
 * Looks up by Smear_User_Id__c so the agent can pass the Supabase UUID it
 * already knows from Topic 1 (GraphQL) without a separate ID lookup.
 *
 * Bulkified: one SOQL for the full request batch.
 */
public with sharing class GetClimberGoal {

    public class Request {
        @InvocableVariable(label='Smear User ID' description='Supabase UUID from the climber\'s Smear account' required=true)
        public String smearUserId;
    }

    public class GoalResult {
        @InvocableVariable(label='Climber Record ID')
        public Id climberId;

        @InvocableVariable(label='Goal Grade (V-scale value)')
        public Decimal goalGrade;

        @InvocableVariable(label='Training Focus')
        public String trainingFocus;

        @InvocableVariable(label='Climber Found')
        public Boolean found;

        @InvocableVariable(label='Error Message')
        public String errorMessage;
    }

    @InvocableMethod(
        label='Get Climber Goal'
        description='Returns a climber\'s goal grade and current training focus from Salesforce by their Smear user ID.'
        category='Smear Coaching'
    )
    public static List<GoalResult> getGoal(List<Request> requests) {
        List<GoalResult> results = new List<GoalResult>();

        Set<String> userIds = new Set<String>();
        for (Request req : requests) {
            if (req.smearUserId != null) {
                userIds.add(req.smearUserId);
            }
        }

        Map<String, Climber__c> climberByUserId = new Map<String, Climber__c>();
        for (Climber__c c : [
            SELECT Id, Smear_User_Id__c, Goal_Grade__c, Training_Focus__c
            FROM Climber__c
            WHERE Smear_User_Id__c IN :userIds
        ]) {
            climberByUserId.put(c.Smear_User_Id__c, c);
        }

        for (Request req : requests) {
            GoalResult result = new GoalResult();
            try {
                Climber__c c = climberByUserId.get(req.smearUserId);
                if (c != null) {
                    result.climberId = c.Id;
                    result.goalGrade = c.Goal_Grade__c;
                    result.trainingFocus = c.Training_Focus__c;
                    result.found = true;
                } else {
                    result.found = false;
                }
            } catch (Exception e) {
                result.found = false;
                result.errorMessage = e.getMessage();
            }
            results.add(result);
        }

        return results;
    }
}
