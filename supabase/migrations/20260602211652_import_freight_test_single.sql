/*
  # Import freight records batch 1 (records 4-203)
  
  Importing 200 freight shipping records from the CSV file.
  These are historical freight/shipping entries with delivery tracking data.
*/

INSERT INTO freight_records (shipment_date,nf_number,nature,client_cnpj,client_name,destination_city,destination_state,destination_cep,volume,weight,nf_value,carrier_name,competencia,day_number,month_name,year_number,invoice_number,cte_number,quote_value,freight_value,quote_vs_nf_pct,freight_vs_nf_pct,cost_value,estimated_delivery,delivered_at,status,business_days,observations) SELECT * FROM (VALUES
('2026-01-02'::date,'104247','VENDA','25.910.449/0004-60','UNIMED ARAXA COOPERATIVA DE TRABALHO MEDICO LTDA','Araxa','MG','38183-390',3::numeric,24::numeric,2456.2::numeric,'TRANSP. ATIVA','2026-01-02 00:00:00'::timestamptz,2,'jan',2026,'1511168','568615',167.63::numeric,167.63::numeric,0.0682::numeric,0.0682::numeric,0.0682::numeric,'2026-01-09'::date,'2026-01-08 00:00:00'::timestamptz,'entregue_prazo',6,NULL::text)
) AS t(shipment_date,nf_number,nature,client_cnpj,client_name,destination_city,destination_state,destination_cep,volume,weight,nf_value,carrier_name,competencia,day_number,month_name,year_number,invoice_number,cte_number,quote_value,freight_value,quote_vs_nf_pct,freight_vs_nf_pct,cost_value,estimated_delivery,delivered_at,status,business_days,observations)
WHERE NOT EXISTS (SELECT 1 FROM freight_records LIMIT 0);
