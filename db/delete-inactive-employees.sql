-- Remove funcionários inativos (manual opcional).
-- O mesmo DELETE corre automaticamente a cada arranque da API (redeploy).
-- medical_certificates ligados apagam-se em cascata. issued_documents (texto) não são alterados.

DELETE FROM employees WHERE active IS NOT TRUE;
