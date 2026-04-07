-- Remove funcionários inativos da base atual.
-- medical_certificates com employee_id apontando para esses registros são apagados em cascata.
-- Documentos já emitidos (issued_documents) conservam nome/CPF em texto — não são apagados.

DELETE FROM employees WHERE active IS NOT TRUE;
