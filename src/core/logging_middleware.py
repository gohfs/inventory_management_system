import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable

# ANSI color codes for terminal output
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"

    # Regular colors
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"

    # Background colors
    BG_RED = "\033[101m"
    BG_GREEN = "\033[102m"
    BG_YELLOW = "\033[103m"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',  # Simplified format for cleaner output
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API requests and responses with enhanced formatting."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timer
        start_time = time.time()

        # Get request details
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"

        # Log incoming request with cyan color
        logger.info(
            f"{Colors.CYAN}{'='*80}\n"
            f"➡️  INCOMING REQUEST: {Colors.BOLD}{method}{Colors.RESET}{Colors.CYAN} {path}\n"
            f"    Client IP: {client_ip}\n"
            f"{'='*80}{Colors.RESET}"
        )

        try:
            # Process request
            response = await call_next(request)

            # Calculate processing time
            process_time = time.time() - start_time
            status_code = response.status_code

            # Log response based on status code with enhanced formatting
            if 200 <= status_code < 300:
                # SUCCESS - Green highlight
                logger.info(
                    f"{Colors.GREEN}{Colors.BOLD}{'='*80}\n"
                    f"✅ SUCCESS: {method} {path}\n"
                    f"{Colors.RESET}{Colors.GREEN}"
                    f"   Status Code: {Colors.BOLD}{status_code}{Colors.RESET}{Colors.GREEN}\n"
                    f"   Response Time: {Colors.BOLD}{process_time:.3f}s{Colors.RESET}{Colors.GREEN}\n"
                    f"   Client: {client_ip}\n"
                    f"{Colors.BOLD}{'='*80}{Colors.RESET}"
                )
            elif 400 <= status_code < 500:
                # CLIENT ERROR - Yellow highlight
                logger.warning(
                    f"{Colors.YELLOW}{Colors.BOLD}{'='*80}\n"
                    f"⚠️  CLIENT ERROR: {method} {path}\n"
                    f"{Colors.RESET}{Colors.YELLOW}"
                    f"   Status Code: {Colors.BOLD}{Colors.BG_YELLOW}{Colors.RED} {status_code} {Colors.RESET}{Colors.YELLOW}\n"
                    f"   Response Time: {process_time:.3f}s\n"
                    f"   Client: {client_ip}\n"
                    f"   💡 Hint: Check request parameters, authentication, or permissions\n"
                    f"{Colors.BOLD}{'='*80}{Colors.RESET}"
                )
            elif 500 <= status_code < 600:
                # SERVER ERROR - Red highlight
                logger.error(
                    f"{Colors.RED}{Colors.BOLD}{'='*80}\n"
                    f"❌ SERVER ERROR: {method} {path}\n"
                    f"{Colors.RESET}{Colors.RED}"
                    f"   Status Code: {Colors.BOLD}{Colors.BG_RED}{Colors.WHITE} {status_code} {Colors.RESET}{Colors.RED}\n"
                    f"   Response Time: {process_time:.3f}s\n"
                    f"   Client: {client_ip}\n"
                    f"   🔥 Critical: Server-side error occurred - check logs above\n"
                    f"{Colors.BOLD}{'='*80}{Colors.RESET}"
                )
            else:
                # OTHER STATUS
                logger.info(
                    f"{Colors.BLUE}{'='*80}\n"
                    f"ℹ️  {method} {path} - Status: {status_code} - "
                    f"Time: {process_time:.3f}s\n"
                    f"{'='*80}{Colors.RESET}"
                )

            return response

        except Exception as e:
            # Calculate processing time for errors
            process_time = time.time() - start_time
            exception_type = type(e).__name__
            exception_msg = str(e)

            # Log exception with prominent red formatting
            logger.error(
                f"{Colors.RED}{Colors.BOLD}{'='*80}\n"
                f"💥 EXCEPTION OCCURRED: {method} {path}\n"
                f"{Colors.RESET}{Colors.RED}"
                f"   Exception Type: {Colors.BOLD}{Colors.BG_RED}{Colors.WHITE} {exception_type} {Colors.RESET}{Colors.RED}\n"
                f"   Error Message: {Colors.BOLD}{exception_msg}{Colors.RESET}{Colors.RED}\n"
                f"   Response Time: {process_time:.3f}s\n"
                f"   Client: {client_ip}\n"
                f"   🔥 Critical: Unhandled exception - check stack trace above\n"
                f"{Colors.BOLD}{'='*80}{Colors.RESET}"
            )

            # Re-raise the exception to be handled by FastAPI
            raise
