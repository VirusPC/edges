import logging
import os

from experiment_webhook.server import serve


def main() -> None:
    logging.basicConfig(
        level=getattr(logging, os.environ.get("LOG_LEVEL", "INFO").upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(message)s",
    )
    serve()


if __name__ == "__main__":
    main()
