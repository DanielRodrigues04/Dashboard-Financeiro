# Dashboard Financeiro Inteligente

## 📌 Sobre o Projeto
O **Dashboard Financeiro Inteligente** é uma aplicação full-stack que permite aos usuários monitorar suas finanças de forma intuitiva, categorizando receitas e despesas, exibindo gráficos interativos e integrando-se a APIs bancárias para importar transações em tempo real.

## 🚀 Tecnologias Utilizadas
### **Frontend:**
- React.js + Vite
- Tailwind CSS
- Chart.js para visualização de dados
- Axios para consumo de APIs

### **Backend:**
- Spring Boot + Quarkus
- PostgreSQL como banco de dados
- Redis para caching
- JWT + OAuth 2.0 para autenticação
- Swagger/OpenAPI para documentação da API
- WebSockets para notificações em tempo real

### **Infraestrutura & DevOps:**
- Docker & Kubernetes para conteinerização
- CI/CD com GitHub Actions
- Monitoramento com Prometheus e Grafana

## ✨ Funcionalidades
✅ Conexão com APIs bancárias para importação automática de transações  
✅ Painel interativo com gráficos dinâmicos para análise de receitas e despesas  
✅ Categorizador automático de gastos  
✅ Notificações sobre gastos excessivos via WebSockets  
✅ Exportação de relatórios em PDF e CSV  
✅ Suporte à multi-moeda com conversão em tempo real  
✅ Dark Mode para melhor experiência do usuário  

## 🔧 Como Executar o Projeto
### 1️⃣ **Clone o Repositório**
```bash
git clone https://github.com/seuusuario/dashboard-financeiro.git
cd dashboard-financeiro
```

### 2️⃣ **Configurar o Backend**
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 3️⃣ **Configurar o Frontend**
```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ **Acesse a aplicação**
Abra o navegador e acesse: `http://localhost:5173`

## 🛠️ Próximas Implementações
- 📌 Integração com Blockchain para maior transparência financeira
- 📌 Algoritmos de machine learning para previsão financeira
- 📌 Aplicativo mobile com Flutter

## 📄 Licença
Este projeto está sob a licença MIT. Sinta-se à vontade para contribuir! 🎉

