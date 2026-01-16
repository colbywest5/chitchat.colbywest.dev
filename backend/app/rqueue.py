import sys
from redis import Redis
from rq import Queue, Worker
from .settings import settings


def get_redis() -> Redis:
    return Redis.from_url(settings.REDIS_URL)


def get_queue(name: str) -> Queue:
    return Queue(name=name, connection=get_redis(), default_timeout=3600)


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python -m app.rqueue worker <queue_name>")
        sys.exit(1)

    mode = sys.argv[1]
    qname = sys.argv[2]
    if mode != "worker":
        print("Only worker mode is supported in MVP")
        sys.exit(1)

    redis = get_redis()
    worker = Worker([qname], connection=redis)
    worker.work(with_scheduler=False)


if __name__ == "__main__":
    main()
