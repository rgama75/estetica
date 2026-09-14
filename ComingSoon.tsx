import { EmptyState } from '../components/ui'

export default function ComingSoon({ moduleName, phase }: { moduleName: string; phase: string }) {
  return (
    <div className="p-8">
      <EmptyState
        title={`${moduleName} chega na ${phase}`}
        description="Este módulo ainda não foi construído. A fundação (organizações, unidades, usuários e permissões) já está pronta para suportá-lo."
      />
    </div>
  )
}
