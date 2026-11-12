"""Durable, versioned snapshots and background experiment records."""
import os
import json
import zlib
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy import create_engine, String, Integer, LargeBinary, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.getenv('AISNL_DATABASE_URL', 'sqlite:///./data/aisnl.db')
if DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+psycopg://', 1)
if DATABASE_URL == 'sqlite:///./data/aisnl.db':
    Path('data').mkdir(exist_ok=True)
options = {'connect_args': {'check_same_thread': False}} if DATABASE_URL.startswith('sqlite') else {}
if DATABASE_URL in ('sqlite://', 'sqlite:///:memory:'):
    options['poolclass'] = StaticPool
engine = create_engine(DATABASE_URL, pool_pre_ping=True, **options)
Session = sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Run(Base):
    __tablename__ = 'runs'
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    saved_at: Mapped[str] = mapped_column(String(50))
    tick: Mapped[int] = mapped_column(Integer)
    population: Mapped[int] = mapped_column(Integer)
    seed: Mapped[str] = mapped_column(String(200))
    version: Mapped[str] = mapped_column(String(30), default='AISNL-1.0.0')
    payload: Mapped[bytes] = mapped_column(LargeBinary)


class Job(Base):
    __tablename__ = 'experiment_jobs'
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    status: Mapped[str] = mapped_column(String(20), default='queued')
    completed: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[str] = mapped_column(String(50))
    request_json: Mapped[str] = mapped_column(Text)
    result: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


def pack(data):
    return zlib.compress(json.dumps(data, separators=(',', ':'), allow_nan=False).encode(), 3)


def unpack(data):
    return json.loads(zlib.decompress(data))


def now():
    return datetime.now(timezone.utc).isoformat()


def initialize():
    Base.metadata.create_all(engine)
    with Session.begin() as db:
        for job in db.query(Job).filter(Job.status.in_(['queued', 'running'])):
            job.status = 'interrupted'
            job.error = 'Server restarted. The saved experiment specification can be submitted again.'
