import {
  TESTIMONIAL_CONTENT_MAX_LENGTH,
  TESTIMONIAL_ROLE_MAX_LENGTH,
  TESTIMONIAL_STATUS,
  type TTestimonialStatus,
} from '@app/schemas';
import { SESSION_STATUS } from '@imphnen-frontend-service/service/session';
import { type SubmitEvent, type ReactElement, useState } from 'react';
import {
  useMyTestimonials,
  useSubmitGuard,
  useTestimonialSubmit,
} from '@/hooks/use-testimonials';
import { withQueryClient } from './providers/QueryIsland';

const CONTENT_MIN_LENGTH = 20;

const STATUS_LABEL: Record<TTestimonialStatus, string> = {
  [TESTIMONIAL_STATUS.PENDING]: 'Menunggu review',
  [TESTIMONIAL_STATUS.APPROVED]: 'Ditampilkan',
  [TESTIMONIAL_STATUS.REJECTED]: 'Ditolak',
};

const STATUS_CLASS: Record<TTestimonialStatus, string> = {
  [TESTIMONIAL_STATUS.PENDING]: 'bg-amber-100 text-amber-700',
  [TESTIMONIAL_STATUS.APPROVED]: 'bg-green-100 text-green-700',
  [TESTIMONIAL_STATUS.REJECTED]: 'bg-red-100 text-red-700',
};

function TestimonialSubmitForm(): ReactElement {
  const [role, setRole] = useState('');
  const [content, setContent] = useState('');
  const [validationMsg, setValidationMsg] = useState('');
  const sessionStatus = useSubmitGuard();
  const authed = sessionStatus === SESSION_STATUS.AUTHENTICATED;
  const myTestimonials = useMyTestimonials(authed);
  const {
    submit,
    isPending,
    submitted,
    errorMessage,
    reset: resetSubmit,
  } = useTestimonialSubmit();
  const errorMsg = validationMsg || errorMessage;

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmedRole = role.trim();
    const trimmedContent = content.trim();

    if (!trimmedRole) {
      setValidationMsg('Role / jabatan tidak boleh kosong.');
      return;
    }
    if (trimmedContent.length < CONTENT_MIN_LENGTH) {
      setValidationMsg(`Testimoni minimal ${CONTENT_MIN_LENGTH} karakter.`);
      return;
    }

    setValidationMsg('');
    submit({ role: trimmedRole, content: trimmedContent }, () => {
      setRole('');
      setContent('');
    });
  };

  const clearError = (): void => {
    setValidationMsg('');
    if (errorMessage) resetSubmit();
  };

  // Checking auth
  if (!authed) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Testimoni Terkirim!
        </h2>
        <p className="text-gray-500 mb-4">
          Terima kasih telah berbagi ceritamu.
        </p>
        <p className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2 mb-8">
          Status: {STATUS_LABEL[submitted.status]}. Testimonimu akan ditampilkan
          setelah disetujui admin.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/testimonials"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-white px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Lihat Semua Testimoni
          </a>
          <button
            type="button"
            onClick={resetSubmit}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Tulis Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-primary"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M0 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h.5a.5.5 0 0 1 0 1H4a2 2 0 0 1-2-2V8a3 3 0 0 1 3-3h.5V2H2zM9 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h.5a.5.5 0 0 1 0 1H13a2 2 0 0 1-2-2V8a3 3 0 0 1 3-3h.5V2H11z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bagikan Pengalamanmu
        </h1>
        <p className="text-gray-500 text-sm">
          Ceritakan pengalamanmu bergabung di komunitas IMPHNEN
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Form */}
      {myTestimonials.length === 0 && (
        <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5"
      >
        {/* Role field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="testimonial-role"
            className="text-sm font-semibold text-gray-700"
          >
            Role / Jabatan <span className="text-red-500">*</span>
          </label>
          <input
            id="testimonial-role"
            type="text"
            required
            maxLength={TESTIMONIAL_ROLE_MAX_LENGTH}
            placeholder="Contoh: Frontend Developer, Mahasiswa Informatika, dsb."
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              clearError();
            }}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
          <p className="text-xs text-gray-400">
            {role.length}/{TESTIMONIAL_ROLE_MAX_LENGTH} karakter
          </p>
        </div>

        {/* Content field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="testimonial-content"
            className="text-sm font-semibold text-gray-700"
          >
            Testimoni <span className="text-red-500">*</span>
          </label>
          <textarea
            id="testimonial-content"
            required
            minLength={CONTENT_MIN_LENGTH}
            maxLength={TESTIMONIAL_CONTENT_MAX_LENGTH}
            rows={6}
            placeholder="Ceritakan pengalamanmu bergabung di IMPHNEN, apa yang kamu pelajari, dan bagaimana komunitas ini membantumu..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              clearError();
            }}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Minimal {CONTENT_MIN_LENGTH} karakter</span>
            <span className={content.length > 900 ? 'text-orange-500' : ''}>
              {content.length}/{TESTIMONIAL_CONTENT_MAX_LENGTH}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Mengirim...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Kirim Testimoni
              </>
            )}
          </button>
          <a
            href="/testimonials"
            className="flex-1 inline-flex items-center justify-center rounded-xl border border-gray-300 text-gray-600 px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Batal
          </a>
        </div>
      </form>
      )}

      {myTestimonials.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Testimoni Kamu
          </h2>
          <ul className="flex flex-col gap-3">
            {myTestimonials.map((testimonial) => (
              <li
                key={testimonial.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {testimonial.role}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_CLASS[testimonial.status]}`}
                  >
                    {STATUS_LABEL[testimonial.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {testimonial.content}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default withQueryClient(TestimonialSubmitForm);
