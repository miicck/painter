from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080

class handler(SimpleHTTPRequestHandler):

	def do_GET(self):
			
		# Default - serve files normally
		super().do_GET()

	def do_POST(self):
		print ("Post..")

try:

	# Start the server
	server = HTTPServer(("", PORT), handler)
	print("Server listening on", PORT)
	server.serve_forever()

except KeyboardInterrupt:

	# Stop the server
	print("\nCtrl-C pressed, shutting down server ...")
	server.socket.close()
	print("... Shutdown complete")
