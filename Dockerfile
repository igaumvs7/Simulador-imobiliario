FROM nginx:alpine

# Copiar os arquivos do projeto para o nginx
COPY . /usr/share/nginx/html/

# Configuração personalizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
