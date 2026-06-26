from fastapi import status


class AppError(Exception):
    def __init__(self, message, *, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, code="app_error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class BadRequestError(AppError):
    def __init__(self, message, *, code="bad_request"):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST, code=code)


class UpstreamAPIError(AppError):
    def __init__(self, message, *, code="upstream_api_error"):
        super().__init__(message, status_code=status.HTTP_502_BAD_GATEWAY, code=code)


class InternalAppError(AppError):
    def __init__(self, message, *, code="internal_app_error"):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, code=code)
