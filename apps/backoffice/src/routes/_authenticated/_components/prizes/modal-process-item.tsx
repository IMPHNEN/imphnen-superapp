import { Button } from '@imphnen-frontend-service/ui/atoms';
import { InputField, Modal } from '@imphnen-frontend-service/ui/molecules';
import type { TGachaClaim } from '../../_hooks/use-gacha';

interface IModalProcessDelivery {
  isOpen: boolean;
  onClose: () => void;
  claim: TGachaClaim | null;
  isProcessing?: boolean;
  handleProcessDelivery?: (claim: TGachaClaim) => void;
}

const CLAIM_STATUS_TEXT: Record<TGachaClaim['status'], string> = {
  pending: 'Undelivered',
  fulfilled: 'Delivered',
};

const ModalProcessDelivery = ({
  isOpen,
  onClose,
  claim,
  isProcessing = false,
  handleProcessDelivery,
}: IModalProcessDelivery) => {
  return (
    <Modal
      className="min-w-[400px] bg-primary-50 rounded-lg p-[40px] flex flex-col gap-8 text-center"
      isOpen={isOpen}
      onClose={onClose}
      disableEscapeKeyDown={true}
    >
      <Modal.Header>
        <h2 className="text-p1 font-semibold text-primary-500 mb-3">
          Delivery Process
        </h2>
        <p className="text-p3 text-neutral-400">
          Lakukan pengiriman hadiah gacha untuk pengguna di bawah ini, jika
          sudah ubah status menjadi “Delivered”.
        </p>
      </Modal.Header>
      <Modal.Content className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <InputField
            label="Nama Lengkap"
            type="text"
            value={claim?.user.name ?? ''}
            size="lg"
            className="w-full"
            readOnly
          />
          <InputField
            label="Email"
            type="text"
            value={claim?.user.email ?? ''}
            size="lg"
            className="w-full"
            readOnly
          />
          <InputField
            label="Item yang didapatkan"
            type="text"
            value={claim ? `${claim.item.name} (${claim.item.code})` : ''}
            size="lg"
            className="w-full"
            readOnly
          />
          <InputField
            label="Status"
            type="text"
            value={claim ? CLAIM_STATUS_TEXT[claim.status] : ''}
            size="lg"
            className="w-full"
            readOnly
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!claim || claim.status !== 'pending' || isProcessing}
          onClick={() => claim && handleProcessDelivery?.(claim)}
        >
          {isProcessing ? 'Memproses…' : 'Tandai Delivered'}
        </Button>
      </Modal.Content>
    </Modal>
  );
};

export default ModalProcessDelivery;
