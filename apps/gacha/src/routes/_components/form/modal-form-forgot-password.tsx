import { Button } from '@imphnen-frontend-service/ui/atoms';
import { Modal, Stepper } from '@imphnen-frontend-service/ui/molecules';
import { ControlledInputField } from '@imphnen-frontend-service/ui/organisms';
import { useQueryState } from '@imphnen-frontend-service/utils';
import type { ReactElement } from 'react';
import { useForgotPasswordRequest } from '../../_hooks/use-password-reset';

const TOTAL_STEPS = 2;

interface IModalFormForgotPasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalFormForgotPassword = ({
  isOpen,
  onClose,
}: IModalFormForgotPasswordProps): ReactElement => {
  const {
    step: currentStep,
    nextStep,
    resetStep,
  } = useQueryState('step', {
    defaultValue: 1,
    maxValue: TOTAL_STEPS,
    minValue: 1,
  });

  const close = (): void => {
    onClose();
    resetStep();
  };

  return (
    <Modal
      className="py-[45px] min-w-[400px] lg:min-w-[455px] px-7"
      isOpen={isOpen}
      onClose={close}
    >
      <Modal.Header className="space-y-4">
        <img src="/logos/logo.svg" alt="" className="h-[70px] w-auto" />
        <h1 className="text-primary-500 text-p1 text-center font-semibold">
          Forgot Password
        </h1>
        <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </Modal.Header>
      <Modal.Content className="space-y-6">
        {currentStep === 1 && <StepEmail onSent={nextStep} onClose={close} />}
        {currentStep === 2 && <StepSent onClose={close} />}
      </Modal.Content>
    </Modal>
  );
};

interface IStepEmailProps {
  onSent: () => void;
  onClose: () => void;
}

const StepEmail = ({ onSent, onClose }: IStepEmailProps): ReactElement => {
  const { form, onSubmit, isPending } = useForgotPasswordRequest(onSent);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ControlledInputField
        control={form.control}
        name="email"
        label="Email"
        placeholder="Masukkan Email yang Terdaftar"
        type="email"
        size="lg"
        className="w-full"
      />
      <div className="flex gap-6">
        <Button
          type="button"
          variant="bordered"
          size="md"
          className="w-full"
          onClick={onClose}
        >
          Back To Login
        </Button>
        <Button
          type="submit"
          size="md"
          className="w-full"
          disabled={isPending || !form.formState.isValid}
        >
          {isPending ? 'Mengirim...' : 'Kirim Link Reset'}
        </Button>
      </div>
    </form>
  );
};

interface IStepSentProps {
  onClose: () => void;
}

const StepSent = ({ onClose }: IStepSentProps): ReactElement => (
  <>
    <p className="text-neutral-500 text-center">
      Jika email terdaftar, link untuk membuat password baru sudah dikirim. Buka
      email kamu dan ikuti link tersebut.
    </p>
    <Button type="button" size="md" className="w-full" onClick={onClose}>
      Back To Login
    </Button>
  </>
);

export default ModalFormForgotPassword;
