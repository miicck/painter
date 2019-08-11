import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from base64 import b64decode

PORT = 8080

# The number of the last submission made
last_sub = 0
for f in os.listdir("submissions"):
	num = int(f.split("_")[-1].split(".")[0])
	if num > last_sub:
		last_sub = num

class handler(SimpleHTTPRequestHandler):

	def __init__(self, *args):

		# Start the handler
		super(handler, self).__init__(*args)
	
	def do_GET(self):
			
		# Default - serve files normally
		super().do_GET()

	def do_POST(self):

		# Get POST'ed data
		content_length = int(self.headers['Content-Length'])
		post_data = self.rfile.read(content_length)

		# Convert POST'ed data to png image
		png_data = str(post_data)
		png_data = png_data[2:-1]
		png_data = png_data.replace("data:image/png;base64,","")
		png_data = b64decode(png_data)
		
		# Write the png to a new submission file
		global last_sub
		last_sub += 1
		f = open("submissions/{0}.png".format(last_sub),"wb")
		f.write(png_data)
		f.close()

		self.send_response(200)
		self.send_header('Content-type', 'text/html')
		self.end_headers()

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
