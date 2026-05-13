public with sharing class GetRecentSessions {

    public class Request {
        @InvocableVariable(label='Smear User ID' description='Supabase UUID from the climber\'s Smear account' required=true)
        public String smearUserId;

        @InvocableVariable(label='Limit' description='Number of recent sessions to retrieve (default 5)')
        public Integer sessionLimit;
    }

    public class SessionResult {
        @InvocableVariable(label='Sessions JSON')
        public String sessionsJson;

        @InvocableVariable(label='Session Count')
        public Integer sessionCount;

        @InvocableVariable(label='Success')
        public Boolean success;

        @InvocableVariable(label='Error Message')
        public String errorMessage;
    }

    @InvocableMethod(
        label='Get Recent Sessions'
        description='Fetches a climber\'s recent bouldering sessions with stats from the Smear app via GraphQL.'
        category='Smear Coaching'
        callout=true
    )
    public static List<SessionResult> getSessions(List<Request> requests) {
        List<SessionResult> results = new List<SessionResult>();
        for (Request req : requests) {
            Integer lim = (req.sessionLimit != null && req.sessionLimit > 0) ? req.sessionLimit : 5;
            results.add(fetchSessions(req.smearUserId, lim));
        }
        return results;
    }

    private static SessionResult fetchSessions(String userId, Integer lim) {
        SessionResult result = new SessionResult();
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:SmearGraphQL');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            String safeId = String.escapeSingleQuotes(userId);
            req.setBody('{"query":"query { recentSessions(userId: \\"' + safeId + '\\", limit: ' + lim + ') { date highestGrade sends flashes totalAttempts } }"}');

            HttpResponse res = new Http().send(req);
            if (res.getStatusCode() == 200) {
                Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                Map<String, Object> data = (Map<String, Object>) parsed.get('data');
                List<Object> sessions = (List<Object>) data.get('recentSessions');
                result.sessionsJson = JSON.serialize(sessions);
                result.sessionCount = sessions.size();
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
