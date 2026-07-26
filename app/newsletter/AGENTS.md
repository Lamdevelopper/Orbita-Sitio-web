# Vista web de Newsletter

`[publicId]/page.tsx` solo muestra snapshots con estado `sent`. La pagina no
recibe identidad del destinatario ni token de baja. El HTML corre en un iframe
sandboxed y sustituye el marcador de baja por el contacto institucional.
