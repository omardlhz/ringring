from flask import Blueprint, render_template

display_bp = Blueprint("display", __name__)


@display_bp.route("/display")
def display():
    return render_template("display.html")
