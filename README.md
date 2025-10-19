# 🚀 Proyecto rimac-appointment

## 📌 Descripción
Este servicio **Serverless** en AWS implementa la gestión de citas médicas de RIMAC.  
Cuenta con cuatro funciones principales:

- **appointment** → maneja peticiones HTTP (`POST`, `GET`) y mensajes desde la cola `event-status-queue`.
- **appointmentPE** → procesa mensajes SNS filtrados por país **Perú (PE)**.
- **appointmentCL** → procesa mensajes SNS filtrados por país **Chile (CL)**.
- **docsUI** → expone la documentación **Swagger/OpenAPI UI**.

---

## 🧱 Requisitos previos

1. **AWS CLI configurado**
   ```bash
   aws configure

npm install -g serverless

npm start

npm deploy