import { useParams } from 'react-router-dom';
import { DOCUMENT_BY_ID } from '@/data/documents';
import { PERIOD_BY_ID } from '@/data/periods';
import { CIVILIZATION_BY_ID } from '@/data/civilizations';
import { DetailShell, Section, Prose, StatusNote } from '@/components/detail/DetailShell';
import { SourceList } from '@/components/detail/SourceList';
import { NotFound } from './NotFound';

const KIND_LABEL: Record<string, string> = {
  tablet: 'Tábua de argila',
  papyrus: 'Papiro',
  manuscript: 'Manuscrito',
  book: 'Livro / tratado',
  diagram: 'Diagrama',
};

export function DocumentPage() {
  const { id } = useParams();
  const doc = id ? DOCUMENT_BY_ID.get(id) : undefined;
  if (!doc) return <NotFound />;

  const period = PERIOD_BY_ID.get(doc.periodId);
  const civ = doc.civilizationId ? CIVILIZATION_BY_ID.get(doc.civilizationId) : undefined;

  return (
    <DetailShell
      kicker="Documento histórico"
      title={doc.title}
      meta={[KIND_LABEL[doc.kind], period?.name, civ?.name].filter(Boolean) as string[]}
    >
      {doc.status.status !== 'documented' && <StatusNote>{doc.status.note}</StatusNote>}

      <Section title="Contexto">
        <Prose>{doc.context}</Prose>
      </Section>

      {doc.transcription && (
        <Section title="Transcrição">
          <Prose>{doc.transcription}</Prose>
        </Section>
      )}

      <Section title="Fontes">
        <SourceList sourceIds={doc.sources} />
      </Section>
    </DetailShell>
  );
}
