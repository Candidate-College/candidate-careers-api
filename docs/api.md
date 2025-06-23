<!-- omit in toc -->
# API Specification
**Base URL**: `http://localhost:3000`

**Authentication**: Refresh token via `Cookie: refresh_token=<REFRESH_TOKEN>`

**Authorization**: Access token via Header `Authorization: Bearer <ACCESS_TOKEN>`

<!-- omit in toc -->
## Table of Content
- [**Standard Response**](#standard-response)
  - [**Success Response**](#success-response)
  - [**Error Response**](#error-response)
- [**Authentication (non MFA)**](#authentication-non-mfa)
  - [**Register**](#register)
  - [**Login**](#login)
  - [**Refresh Access Token**](#refresh-access-token)
  - [**Logout**](#logout)
- [**Basic CRUD Example (Events)**](#basic-crud-example-events)
  - [**Get All Events**](#get-all-events)
  - [**Get Event by Slug**](#get-event-by-slug)
  - [**Create a new Event**](#create-a-new-event)
  - [**Update an Event**](#update-an-event)
  - [**Delete an Event**](#delete-an-event)

## **Standard Response**
### **Success Response**
```
{
  "statusCode": "number",
  "message": "string",
  "data": "object[] | object"
}
```
### **Error Response**
```
{
  "statusCode": "number",
  "message": "string",
  "errors": "Record<string, string[]>",
}
```
## **Authentication (non MFA)**
### **Register**
- **Method**: POST
- **Path**: `/api/v1/auth/register`
- **Headers**:
    - **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Body**:
  ```
  {
    "name": "string",
    "email": "string|email",
    "password": "string|min:6"
  }
  ```
**Response**:
- Success:
  ```
  {
    "statusCode": 200,
    "message": "Successfully registered new user!",
    "data": "Partial<UserData>"
  }
  ```
- Error:
  ```
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": {
      "name": ["string"],
      "email": ["string"],
      "password": ["string"]
    }
  }
  ```
  ```
  {
    "statusCode": 409,
    "message": "User already registered"
  }
  ```
  ```
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```

### **Login**
- **Method**: POST
- **Path**: `/api/v1/auth/login`
- **Headers**:
  - **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- Body:
  ```
  {
    "email": "string|email",
    "password": "string|min:6"
  }
  ```
Response:
- Success:
  - **Set-Cookie**: `refresh_token=<REFRESH_TOKEN>`
  ```
  {
    "statusCode": 200,
    "message": "Successfully logged in!",
    "data": {
      "user": "Partial<UserData>",
      "token": {
        "type": "string",
        "access": "string",
        "expiresIn": "string|number"
      },
    },
  }
  ```
- Error:
  ```
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": {
      "email": ["string"],
      "password": ["string"]
    }
  }
  ```
  ```
  {
    "statusCode": 401,
    "message": "Invalid credentials"
  }
  ```
  ```
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```

### **Refresh Access Token**
- Method: POST
- Path: `/api/v1/auth/refresh`
- Header:
  - **Cookie**: `refresh_token=<REFRESH_TOKEN>`

Response:
- Success:
  - **Set-Cookie**: `refresh_token=<NEW_REFRESH_TOKEN>`
  ```
  {
    "statusCode": 200,
    "message": "Successfully refreshed access token!",
    "data": {
      "user": "Partial<UserData>",
      "token": {
        "type": "string",
        "access": "string",
        "expiresIn": "string|number"
      }
    }
  }
  ```
- Error:
  ```
  {
    "statusCode": 400,
    "message": "Refresh token is required"
  }
  ```
  ```
  {
    "statusCode": 401,
    "message": "Invalid refresh token"
  }
  ```
  ```
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```

### **Logout**
- **Method**: DELETE
- **Path**: `/api/v1/auth/logout`
- **Headers**:
  - **Cookie**: `refresh_token=<REFRESH_TOKEN>`

Response:
- Success:
  - **Set-Cookie**: `refresh_token=`
  ```
  "statusCode": 200,
  "message": "Successfully logged out!",
  "data": "Partial<UserData>"
  ```
- Error:
  ```
  {
    "statusCode": 400,
    "message": "Refresh token is required"
  }
  ```
  ```
  {
    "statusCode": 401,
    "message": "Invalid refresh token"
  }
  ```
  ```
  {
    "statusCode": 401,
    "message": "User session not found"
  }
  ```
  ```
  {
    "statusCode": 401,
    "message": "User not found"
  }
  ```
  ```
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```

## **Basic CRUD Example (Events)**
### **Get All Events**
- **Method**: GET
- **Path**: `/api/v1/events`
- **Query Parameters**:
  - **page**: `number`
  - **perPage**: `number`
  - **sortBy**: `string|only:starts_at,ends_at`
  - **sortDirection**: `string|only:asc,desc`

Response:
- Success:
  ```
  {
    "statusCode": 200,
    "message": "Successfully get events!",
    "data": [
      {
        ...Partial<EventData>,
        "category": Partial<EventCategoryData>
      },
      ...
    ]
  }
  ```
- Error:
  ```
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": {
      "page": ["string"],
      "perPage": ["string"],
      "sortBy": ["string"],
      "sortDirection": ["string"]
    }
  }
  ```
  ```
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```

### **Get Event by Slug**
- **Method**: GET
- **Path**: `/api/v1/events/:slug`

Response:
- Success:
  ```
  {
    "statusCode": 200,
    "message": "Successfully get event by identifier!",
    "data": {
      ...Partial<EventData>,
      "category": Partial<EventCategoryData>
    }
  }
  ```
- Error:
  ```
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": {
      "slug": ["string"]
    }
  }
  ```
  ```
  {
    "statusCode": 404,
    "message": "Event not found"
  }
  ```
  ```
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```

### **Create a new Event**
- **Method**: POST
- **Path**: `/api/v1/events`
- **Headers**:
  - **Authentication**: `Bearer <ACCESS_TOKEN>`
  - **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Body**:
  ```
  {
    "category_id": "number",
    "title": "string",
    "snippet": "string|optional",
    "content": "string",
    "cover": "image|optional",
    "starts_at": "timestamp",
    "ends_at": "timestamp"
  }
  ```
Response:
- Success:
  ```
  {
    "statusCode": 200,
    "message": "Successfully create an event!",
    "data": {
      ...Partial<EventData>,
      "category": Partial<EventCategoryData>
    }
  }
  ```
- Error:
  ```
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": {
      "category_id": ["string"],
      "title": ["string"],
      "snippet": ["string"],
      "content": ["string"],
      "cover": ["string"],
      "starts_at": ["string"],
      "ends_at": ["string"],
    }
  }
  ```
  ```
  {
    "statusCode": 401,
    "message": "Unauthorized"
  }
  ```
  ```
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```

### **Update an Event**
- **Method**: PATCH
- **Path**: `/api/v1/events/:slug`
- **Headers**:
  - **Authentication**: `Bearer <ACCESS_TOKEN>`
  - **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Body**:
  ```
  {
    "category_id": "number|optional",
    "title": "string|optional",
    "snippet": "string|optional",
    "content": "string|optional",
    "cover": "image|optional",
    "starts_at": "timestamp|optional",
    "ends_at": "timestamp|optional"
  }
  ```
Response:
- Success:
  ```
  {
    "statusCode": 200,
    "message": "Successfully update an event!",
    "data": {
      ...Partial<EventData>,
      "category": Partial<EventCategoryData>
    }
  }
  ```
- Error:
  ```
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": {
      "slug": ["string"],
      "category_id": ["string"],
      "title": ["string"],
      "snippet": ["string"],
      "content": ["string"],
      "cover": ["string"],
      "starts_at": ["string"],
      "ends_at": ["string"],
    }
  }
  ```
  ```
  {
    "statusCode": 401,
    "message": "Unauthorized"
  }
  ```
  ```
  {
    "statusCode": 404,
    "message": "Event not found"
  }
  ```
  ```
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```

### **Delete an Event**
- **Method**: DELETE
- **Path**: `/api/v1/events/:slug`
- **Headers**:
  - **Authentication**: `Bearer <ACCESS_TOKEN>`

Response:
- Success:
  ```
  {
    "statusCode": 200,
    "message": "Successfully delete an event!",
    "data": {
      ...Partial<EventData>,
      "category": Partial<EventCategoryData>,
      "deleted_at": "timestamp"
    }
  }
  ```
- Error:
  ```
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": {
      "slug": ["string"],
    }
  }
  ```
  ```
  {
    "statusCode": 401,
    "message": "Unauthorized"
  }
  ```
  ```
  {
    "statusCode": 404,
    "message": "Event not found"
  }
  ```
  ```
  {
    "statusCode": 500,
    "message": "Internal server error"
  }
  ```
