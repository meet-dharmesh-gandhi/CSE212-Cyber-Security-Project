from flask import Flask, request, render_template
import smtplib
import requests

app = Flask(__name__)

# ✅ Get Attacker's Location
def get_location(ip_address):
    try:
        response = requests.get(f"http://ip-api.com/json/{ip_address}")
        data = response.json()
        print("API Response:", data)  # Debugging line

        if data["status"] == "fail":
            return f"Location not found for IP: {ip_address} (Reason: {data.get('message', 'Unknown')})"

        location_details = (
            f"🌍 Location: {data['city']}, {data['regionName']}, {data['country']}\n"
            f"🌐 ISP: {data['isp']}\n"
            f"📍 Lat: {data['lat']}, Lon: {data['lon']}"
        )
        return location_details
    except Exception as e:
        return f"Error fetching location: {e}"

# ✅ Email Alert Function
def send_alert_email(ip_address, location_details):
    EMAIL_SENDER = "kuntal20502@gmail.com"
    EMAIL_PASSWORD = "dxgo nmak utkx hqog"
    EMAIL_RECEIVER = "anshrathva38@gmail.com"

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)

        # Fix: UTF-8 encoding for the message
        subject = "🚨 Login Attempt Alert"
        body = f"Someone failed to log in from IP: {ip_address}\n\n{location_details}"

        message = f"Subject: {subject}\nMIME-Version: 1.0\nContent-Type: text/plain; charset=utf-8\n\n{body}".encode("utf-8")

        server.sendmail(EMAIL_SENDER, EMAIL_RECEIVER, message)
        print("✅ Alert email sent successfully!")

    except Exception as e:
        print(f"[❌] Email Failed: {e}")  # Logs the exact error
    finally:
        server.quit()

# ✅ Login Route
@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        # Dummy Check: Replace with your real authentication logic
        if username == "admin" and password == "password123":
            return "✅ Login Successful!"
        else:
            # Get real external IP
            ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
            print(f"[⚠] Failed login from: {ip_address}")

            # Get location details
            location_details = get_location(ip_address)

            # Send alert email
            send_alert_email(ip_address, location_details)

            return "❌ Incorrect Username or Password!"

    return render_template("login.html")  # Your HTML form

# ✅ Run Flask App
if __name__ == "__main__":
    app.run(debug=True)
