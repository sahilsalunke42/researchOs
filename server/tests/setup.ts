process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://researchos:researchos@localhost:5432/researchos_test';
process.env.JWT_SECRET ??= 'test-secret-min-32-chars-xxxxxxxxxxxxxxx';
process.env.AI_SERVICE_URL ??= 'http://localhost:8000';
process.env.PORT ??= '4000';
process.env.CORS_ORIGIN ??= 'http://localhost:3000';
