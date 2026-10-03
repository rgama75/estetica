import { EmptyState } from '../components/ui'

export default function ComingSoon({ moduleName, phase }: { moduleName: string; phase: string }) {
  return (
    <div className="p-8">
      <EmptyState
        title={`${moduleName} em breve`}
        description="Estamos preparando este módulo. Enquanto isso, você já pode configurar sua clínica, unidades e equipe."
      />
    </div>
  )
}
