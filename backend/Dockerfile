FROM node:20-bullseye-slim

WORKDIR /app

# Instala Python y pip (necesario para ejecutar model.py) y dependencias Python
RUN apt-get update && apt-get install -y python3 python3-pip \
	&& pip3 install requests \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

EXPOSE 3001
ENV PORT=3001
CMD ["npm", "start"]
