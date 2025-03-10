import os
from flask import Flask
from flask_migrate import Migrate
from app import app, db
from config import DevelopmentConfig
# Load config from environment variable
app.config.from_object(DevelopmentConfig)

# Setup migrations
migrate = Migrate(app, db)

# Flask CLI commands
@app.cli.command('db-init')
def init_db():
    """Initialize the database"""
    db.create_all()
    print("Database initialized!")

@app.cli.command('db-upgrade')
def upgrade_db():
    """Run database migrations"""
    from flask_migrate import upgrade
    upgrade()
    print("Database upgraded!")

@app.cli.command('db-downgrade')
def downgrade_db():
    """Downgrade the database"""
    from flask_migrate import downgrade
    downgrade()
    print("Database downgraded!")

if __name__ == '__main__':
    app.run()