# 1. Use a lightweight Node.js environment
FROM node:18-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy only the package files first (this makes rebuilding faster)
COPY package*.json ./

# 4. Install all dependencies
RUN npm install
RUN npm install -g typescript
# 5. Copy the Prisma schema and generate the database client
COPY prisma ./prisma
RUN npx prisma generate

# 6. Copy all your actual code (src folder, tsconfig, etc.)
COPY . .

# 7. Compile the TypeScript code into normal JavaScript
RUN npm run build

# 8. Tell Docker how to start your app
CMD ["node", "./dist/index.js"]