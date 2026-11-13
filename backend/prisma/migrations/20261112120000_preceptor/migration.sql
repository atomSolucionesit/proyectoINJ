-- Rol nuevo: preceptor
ALTER TABLE `usuarios` MODIFY `rol` ENUM('admin', 'profesor', 'alumno', 'padre', 'bibliotecaria', 'preceptor') NOT NULL;
