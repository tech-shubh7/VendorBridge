/**
 * Application Constants: HTTP Status Codes
 */
const STATUS_CODES = {
    // 2xx Success 
    SUCCESS: 200,      // General success (GET, PUT updates)
    CREATED: 201,      // Successful creation of a resource (POST)
    NO_CONTENT: 204,   // Success, but returning no body (often used for DELETE)

    // 4xx Client Errors 
    BAD_REQUEST: 400,  // Syntax error or malformed request (generic client error)
    UNAUTHORIZED: 401, // User is not logged in / missing valid Auth token
    FORBIDDEN: 403,    // User is logged in but lacks permission for this specific action
    NOT_FOUND: 404,    // The requested resource (User, Post, etc.) does not exist
    CONFLICT: 409,     // Resource already exists (e.g., trying to register an email that's taken)
    UNPROCESSABLE_ENTITY: 422, // Validation errors (e.g., password too short, invalid email format)
    TOO_MANY_REQUESTS: 429,    // User has hit the rate limit (spam protection)

    // 5xx Server Errors 
    INTERNAL_SERVER_ERROR: 500 // Something broke on the server (Database down, code crashed)
};

export default STATUS_CODES;
