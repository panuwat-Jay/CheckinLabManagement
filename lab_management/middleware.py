import logging

logger = logging.getLogger(__name__)

class CsrfDebugMiddleware:
    """Simple middleware to log CSRF cookie and token values on every POST.

    This runs *before* CsrfViewMiddleware so we can see what the browser sent even
    when the request is rejected with 403.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'POST':
            tok = request.POST.get('csrfmiddlewaretoken')
            cookie = request.COOKIES.get('csrftoken')
            raw = request.META.get('HTTP_COOKIE')
            host = request.get_host()
            referer = request.META.get('HTTP_REFERER')
            logger.debug(f"Middleware CSRF POST host={host} referer={referer} token={tok} cookie={cookie} raw_cookie={raw}")
            # also print to stdout so dev server definitely shows it
            print(f"CSRFDBG host={host} referer={referer} token={tok} cookie={cookie} raw_cookie={raw}")
        return self.get_response(request)
