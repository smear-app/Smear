public with sharing class GetClimberProfile {

    public class Request {
        @InvocableVariable(label='Smear User ID' description='Supabase UUID from the climber\'s Smear account' required=true)
        public String smearUserId;
    }

    public class ProfileResult {
        @InvocableVariable(label='Working Grade')
        public String workingGrade;

        @InvocableVariable(label='Send Rate')
        public Decimal sendRate;

        @InvocableVariable(label='Flash Rate')
        public Decimal flashRate;

        @InvocableVariable(label='Plateau Weeks')
        public Integer plateauWeeks;

        @InvocableVariable(label='Success')
        public Boolean success;

        @InvocableVariable(label='Error Message')
        public String errorMessage;
    }

    @InvocableMethod(
        label='Get Climber Profile'
        description='Fetches a climber\'s working grade, send rate, flash rate, and plateau weeks from the Smear app via GraphQL.'
        category='Smear Coaching'
        callout=true
    )
    public static List<ProfileResult> getProfile(List<Request> requests) {
        List<ProfileResult> results = new List<ProfileResult>();
        for (Request req : requests) {
            results.add(fetchProfile(req.smearUserId));
        }
        return results;
    }

    private static ProfileResult fetchProfile(String userId) {
        ProfileResult result = new ProfileResult();
        try {
            String safeId = String.escapeSingleQuotes(userId);
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:SmearGraphQL');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setBody('{"query":"query { climberProfile(userId: \\"' + safeId + '\\") { workingGrade sendRate flashRate plateauWeeks } }"}');

            HttpResponse res = new Http().send(req);
            if (res.getStatusCode() == 200) {
                Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                Map<String, Object> data = (Map<String, Object>) parsed.get('data');
                Map<String, Object> profile = (Map<String, Object>) data.get('climberProfile');
                result.workingGrade = (String) profile.get('workingGrade');
                result.sendRate = Decimal.valueOf(String.valueOf(profile.get('sendRate')));
                result.flashRate = Decimal.valueOf(String.valueOf(profile.get('flashRate')));
                Object pw = profile.get('plateauWeeks');
                result.plateauWeeks = pw != null ? Integer.valueOf(String.valueOf(pw)) : null;
                result.success = true;
            } else {
                result.success = false;
                result.errorMessage = 'HTTP ' + res.getStatusCode() + ': ' + res.getBody();
            }
        } catch (Exception e) {
            result.success = false;
            result.errorMessage = e.getMessage();
        }
        return result;
    }
}
