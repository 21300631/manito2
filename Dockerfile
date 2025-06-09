# Usa una imagen oficial de Python
FROM python:3.9.0

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos
COPY . /app

# Instala dependencias
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Expone el puerto
EXPOSE 8000

# Comando para iniciar Gunicorn
CMD ["gunicorn", "manito.wsgi:application", "--bind", "0.0.0.0:8000"]
