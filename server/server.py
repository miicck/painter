from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 8080

class handler(BaseHTTPRequestHandler):
	
	# Handle a GET request
	def do_GET(self):
		self.send_response(200)
		self.send_header("Content-type", "text/html")
		self.end_headers()
		self.wfile.write(bytes("Hello world!", "utf-8"))
		return

try:
	server = HTTPServer(("", PORT), handler)
	print("Server listening on", PORT)
	server.serve_forever()

except KeyboardInterrupt:
	print("\nCtrl-C pressed, shutting down server ...")
	server.socket.close()
	print("... Shutdown complete")
