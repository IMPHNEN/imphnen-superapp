import { createFileRoute, Link, Navigate } from '@tanstack/react-router';
import { type ReactElement, useState } from 'react';
import { RegisterResetBanner } from '@imphnen-frontend-service/ui/organisms';
import { Button, Textarea } from '@imphnen-frontend-service/ui/atoms';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import {
  InputField,
  RegisterMentorStep,
  SelectField,
} from '@imphnen-frontend-service/ui/molecules';
import {
  MENTOR_STATUS,
  useMyMentorApplication,
} from './_hooks/use-mentor-application';
import {
  DOCUMENT_ACCEPT,
  OTHER_TOPIC,
  useMentorRegisterForm,
} from './_hooks/use-mentor-register-form';

export const Route = createFileRoute('/_authenticated/auth/register-mentor')({
  component: RegisterMentorPage,
});

const LAST_STEP = 4;
type TStep = 1 | 2 | 3 | 4;

function RegisterMentorPage(): ReactElement | null {
  const application = useMyMentorApplication();
  const [step, setStep] = useState<TStep>(1);
  const { form, onSubmit, validateStep, isSubmitting } =
    useMentorRegisterForm();
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  if (application.isPending) return null;

  const status = application.data?.status;
  if (status === MENTOR_STATUS.PENDING) {
    return <Navigate to="/auth/register-mentor/pending" />;
  }
  if (status === MENTOR_STATUS.ACTIVE || status === MENTOR_STATUS.INACTIVE) {
    return <Navigate to="/auth/register-mentor/success" />;
  }

  const goNext = async () => {
    if (await validateStep(step)) {
      setStep((current) => Math.min(current + 1, LAST_STEP) as TStep);
    }
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 1) as TStep);

  const topic = watch('topic');

  return (
    <main className="bg-primary-50 min-h-screen">
      <div className="flex flex-col justify-center items-center min-h-screen py-[60px] px-[80px]">
        <div className="bg-white xl:min-w-[1130px] min-h-[712px] p-10 rounded-2xl shadow-md flex gap-6">
          <RegisterResetBanner />
          <div className="xl:border-2 xl:border-primary-500/50 xl:w-[726px] rounded-lg py-[32px] px-[48px] flex justify-center">
            <div className="xl:w-[714px]">
              <Link to="/dashboard">
                <Button className="xl:hidden gap-3" variant="secondary">
                  <ArrowLeftOutlined />
                  Dashboard
                </Button>
              </Link>
              <RegisterMentorStep step={step} />
              <h3 className="mt-5 text-3xl font-semibold text-primary-500">
                Register
              </h3>
              <h5 className="text-primary-500 font-medium">
                Welcome to the team, Mentor - powered by IMPHNEN
              </h5>
              {status === MENTOR_STATUS.REJECTED && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  Pendaftaran sebelumnya ditolak
                  {application.data?.reviewNote
                    ? `: ${application.data.reviewNote}`
                    : '.'}{' '}
                  Kamu bisa memperbaiki data dan mendaftar ulang.
                </div>
              )}
              <form onSubmit={onSubmit}>
                <div className={`${step !== 1 ? 'hidden' : ''}`}>
                  <div className="mt-7 mb-2">
                    <InputField
                      label="Nama Lengkap"
                      size="lg"
                      className="w-full"
                      placeholder="Nama Lengkap (sesuai identitas)"
                      error={errors.legalName?.message}
                      {...register('legalName')}
                    />
                  </div>
                  <SelectField
                    label="Jenis Kelamin"
                    size="lg"
                    error={errors.gender?.message}
                    {...register('gender')}
                  >
                    <option value="" disabled hidden>
                      Pilih Jenis Kelamin
                    </option>
                    <option value="laki-laki">Laki - Laki</option>
                    <option value="perempuan">Perempuan</option>
                  </SelectField>
                  <div className="my-2">
                    <InputField
                      label="No Telp/Whatsapp Only"
                      size="lg"
                      className="w-full"
                      placeholder="Contoh : 08123456789"
                      error={errors.phoneNumber?.message}
                      {...register('phoneNumber')}
                    />
                  </div>
                  <SelectField
                    label="Domisili"
                    size="lg"
                    error={errors.domicile?.message}
                    {...register('domicile')}
                  >
                    <option value="" disabled hidden>
                      Pilih Domisili
                    </option>
                    <option value="aceh">Aceh</option>
                    <option value="jawa-selatan">Jawa Selatan</option>
                  </SelectField>
                  <div className="mt-2">
                    <SelectField
                      label="Pendidikan Terakhir"
                      size="lg"
                      error={errors.lastEducation?.message}
                      {...register('lastEducation')}
                    >
                      <option value="" disabled hidden>
                        Apa pendidikan terakhir senpai
                      </option>
                      <option value="SMA">SMA</option>
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                    </SelectField>
                  </div>
                </div>
                <div className={`${step !== 2 ? 'hidden' : ''}`}>
                  <div className="mt-7 mb-2 gap-2 flex flex-col">
                    <InputField
                      label="Perusahaan Saat Ini"
                      size="lg"
                      className="w-full"
                      placeholder="Masukkan Perusahaan tempat kerja, Senpai~! ✨ (Pastikan tidak typo, ya~ 😆)"
                      error={errors.currentCompany?.message}
                      {...register('currentCompany')}
                    />
                    <InputField
                      label="Masukan jabatan senpai di perusahaan"
                      size="lg"
                      className="w-full"
                      placeholder="Masukan jabatan senpai di perusahaan"
                      error={errors.currentRole?.message}
                      {...register('currentRole')}
                    />
                    <InputField
                      label="Lama Pengalaman (tahun)"
                      size="lg"
                      className="w-full"
                      inputMode="numeric"
                      placeholder="Contoh : 5"
                      error={errors.yearsOfExperience?.message}
                      {...register('yearsOfExperience')}
                    />
                    <SelectField
                      label="Topik Keahlian Yang Ingin Diajarkan"
                      size="lg"
                      error={errors.topic?.message}
                      {...register('topic')}
                    >
                      <option value="" disabled hidden>
                        Apa yang ingin anda ajarkan senpaii
                      </option>
                      <option value="Frontend Developer">
                        Frontend Developer
                      </option>
                      <option value="Backend Developer">
                        Backend Developer
                      </option>
                      <option value={OTHER_TOPIC}>Other</option>
                    </SelectField>
                    <InputField
                      label={`Jika Mengisi “Other”, Tulis Topik yang Kamu Kuasai`}
                      size="lg"
                      className="w-full"
                      placeholder="Tolong isi jika tidak ada di pilihan senpai"
                      disabled={topic !== OTHER_TOPIC}
                      error={errors.otherTopic?.message}
                      {...register('otherTopic')}
                    />
                    <InputField
                      label="Skill Utama yang Kamu Miliki (boleh lebih dari satu)"
                      size="lg"
                      className="w-full"
                      placeholder="Pisahkan dengan koma, contoh : React, Node.js"
                      error={errors.skills?.message}
                      {...register('skills')}
                    />
                  </div>
                </div>
                <div className={`${step !== 3 ? 'hidden' : ''}`}>
                  <div className="mt-7 mb-2 gap-2 flex flex-col">
                    <SelectField
                      label="Komitmen Waktu Mentoring"
                      size="lg"
                      error={errors.availabilityCommitment?.message}
                      {...register('availabilityCommitment')}
                    >
                      <option value="" disabled hidden>
                        Seberapa sering senpai bisa mentoring?
                      </option>
                      <option value="1 sesi per minggu">
                        1 sesi per minggu
                      </option>
                      <option value="2-3 sesi per minggu">
                        2-3 sesi per minggu
                      </option>
                      <option value="Akhir pekan saja">Akhir pekan saja</option>
                      <option value="Fleksibel sesuai jadwal">
                        Fleksibel sesuai jadwal
                      </option>
                    </SelectField>
                    <SelectField
                      label="Format Pengajaran yang Anda Sediakan"
                      size="lg"
                      error={errors.mentoringFormat?.message}
                      {...register('mentoringFormat')}
                    >
                      <option value="" disabled hidden>
                        Pilih format pengajaran
                      </option>
                      <option value="online">Online (1-on-1)</option>
                      <option value="offline">Offline (tatap muka)</option>
                    </SelectField>
                    <InputField
                      type="file"
                      label="Unggah Curiculum Vitae (Opsional)"
                      size="lg"
                      className="w-full"
                      accept={DOCUMENT_ACCEPT}
                      error={errors.cv?.message}
                      onChange={(event) =>
                        setValue('cv', event.target.files?.[0] ?? null, {
                          shouldValidate: true,
                        })
                      }
                    />
                    <InputField
                      label="Unggah Portofolio"
                      size="lg"
                      className="w-full"
                      placeholder="https:// Google Drive, Behance, GitHub, Notion, dan lainnya"
                      error={errors.portfolioUrl?.message}
                      {...register('portfolioUrl')}
                    />
                    <InputField
                      label="Honorarium yang Diharapkan per Sesi (Online) Durasi rata-rata sesi: 2,5–3 jam"
                      size="lg"
                      className="w-full"
                      inputMode="numeric"
                      placeholder="Isi Nominalnya dong senpaiii!!!"
                      error={errors.mentoringRate?.message}
                      {...register('mentoringRate')}
                    />
                    <h6 className="text-xs">
                      Silahkan isi dalam angka (Contoh:500.000)
                    </h6>
                  </div>
                </div>
                <div className={`${step !== 4 ? 'hidden' : ''}`}>
                  <div className="mt-7 mb-2 gap-2 flex flex-col">
                    <label
                      htmlFor="mentor-bio"
                      className="text-sm font-medium text-foreground"
                    >
                      Ceritakan Tentang Dirimu
                    </label>
                    <Textarea
                      id="mentor-bio"
                      className="w-full h-32"
                      placeholder="Pengalaman, pencapaian, dan gaya mentoring senpai (minimal 50 karakter)"
                      {...register('bio')}
                    />
                    {errors.bio?.message && (
                      <p className="text-xs text-destructive">
                        {errors.bio.message}
                      </p>
                    )}
                    <InputField
                      label="LinkedIn (Opsional)"
                      size="lg"
                      className="w-full"
                      placeholder="https://linkedin.com/in/username"
                      error={errors.linkedinUrl?.message}
                      {...register('linkedinUrl')}
                    />
                    <InputField
                      label="GitHub (Opsional)"
                      size="lg"
                      className="w-full"
                      placeholder="https://github.com/username"
                      error={errors.githubUrl?.message}
                      {...register('githubUrl')}
                    />
                    <InputField
                      type="file"
                      label="Unggah Dokumen Identitas (KTP/Paspor)"
                      size="lg"
                      className="w-full"
                      accept={DOCUMENT_ACCEPT}
                      isRequired
                      error={errors.identity?.message}
                      onChange={(event) =>
                        setValue('identity', event.target.files?.[0] ?? null, {
                          shouldValidate: true,
                        })
                      }
                    />
                    <h6 className="text-xs">
                      PDF, JPG, PNG, atau WebP. Maksimal 5MB. Dokumen hanya
                      dilihat oleh tim verifikasi.
                    </h6>
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <Button
                    variant="secondary"
                    onClick={goBack}
                    type="button"
                    className={`${step === 1 ? 'hidden' : ''}`}
                    disabled={isSubmitting}
                  >
                    <ArrowLeftOutlined />
                    Kembali
                  </Button>
                  <Button
                    variant="primary"
                    onClick={goNext}
                    type="button"
                    className={`${step === LAST_STEP ? 'hidden' : ''}`}
                  >
                    Lanjutkan
                    <ArrowRightOutlined />
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className={`${step === LAST_STEP ? '' : 'hidden'}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Mengirim...' : 'Selesaikan'}
                    <ArrowRightOutlined />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
