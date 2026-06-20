import swaggerJsDoc from 'swagger-jsdoc';
const swaggerOptions={
    definition:{
        openapi: '3.0.0',
        info: {
            title: 'Shikshya Kendra API',
            version: '1.0.0',
            description: 'API documentation for Shikshya Kendra backend'
        },
        tags: [
            { name: 'Auth' },
            { name: 'School' },
            { name: 'Student' },
            { name: 'Academic Year' },
            { name: 'Class' },
            { name: 'Section' },
            { name: 'Subject' },
            { name: 'Teacher' },
            { name: 'Librarian' },
            { name: 'Accountant' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        servers:[{
            url: `http://localhost:${process.env.PORT || 8080}`,
        }]
    },
    apis: ['./src/routes/*.ts'],
}
const swaggerDocs=swaggerJsDoc(swaggerOptions);
export default swaggerDocs;