-- Verifica si la columna existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'project_equipment'
    AND column_name = 'expected_return_date'
  ) THEN
    -- Agregar la columna si no existe
    ALTER TABLE project_equipment ADD COLUMN expected_return_date TIMESTAMP;
    RAISE NOTICE 'Columna expected_return_date añadida con éxito.';
  ELSE
    RAISE NOTICE 'La columna expected_return_date ya existe.';
  END IF;
END $$;