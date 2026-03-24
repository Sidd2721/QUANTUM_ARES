# frontend/Dockerfile
# STUB — P2 will replace this with their React build.
# For now, serves a placeholder HTML page so docker-compose doesn't fail.

FROM nginx:alpine

# Stub index.html — shows API is running even before P2's frontend is ready
RUN echo '<html><body><h2>QUANTUM-ARES Frontend</h2><p>P2 frontend not yet connected. API running at <a href="http://localhost:8000/health">/health</a></p></body></html>' \
    > /usr/share/nginx/html/index.html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
