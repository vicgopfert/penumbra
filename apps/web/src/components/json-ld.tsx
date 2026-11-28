// Dados estruturados para os buscadores. Como texto, o React escaparia o "<" como entidade, que
// dentro do script não é decodificada; o "<" escapado no JSON impede que um texto da IGDB feche a tag.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD, motivo acima
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
