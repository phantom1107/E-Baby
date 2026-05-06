"""Routes package for E-Baby Flask app"""
from flask import Blueprint

# Import all route blueprints
from .reviews import reviews_bp

def register_blueprints(app):
    """Register all blueprints with the Flask app"""
    app.register_blueprint(reviews_bp)
