import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import type {
  Materiaal,
  UpdateDraftPayload,
  WerkorderDetail,
  WerkorderFormData
} from '../types/Werkorder';

import MateriaalSection
  from './MateriaalSection';

import FotoSection, {
  type FotoItem
} from './FotoSection';

import {
  completeDraft,
  createDraft,
  getFotoBlob,
  updateDraft,
  updateDraftMaterialen,
  uploadFoto
} from '../services/werkorderService';

interface WerkorderFormProps {
  initialDetail?:
    WerkorderDetail;

  existingDraftId?:
    number;
}

type AutoSaveStatus =
  | 'idle'
  | 'unsaved'
  | 'saving'
  | 'saved'
  | 'error';

const AUTO_SAVE_DELAY =
  1500;

const generateWerkorderId =
  (): string => {
    const now =
      new Date();

    const pad = (
      value: number
    ): string =>
      String(value)
        .padStart(
          2,
          '0'
        );

    return [
      now.getFullYear(),

      pad(
        now.getMonth() +
        1
      ),

      pad(
        now.getDate()
      ),

      pad(
        now.getHours()
      ),

      pad(
        now.getMinutes()
      ),

      pad(
        now.getSeconds()
      )
    ].join('');
  };

const getToday =
  (): string => {
    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        '0'
      );

    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        '0'
      );

    return (
      `${year}-${month}-${day}`
    );
  };

const isValidDateString = (
  value: string
): boolean => {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(value);

  if (!match) {
    return false;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  if (
    year < 1900 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return (
    date.getFullYear() ===
      year &&
    date.getMonth() ===
      month - 1 &&
    date.getDate() ===
      day
  );
};

const getDateError = (
  datum: string
): string | null => {
  if (!datum) {
    return (
      'De datum is verplicht.'
    );
  }

  if (
    !isValidDateString(
      datum
    )
  ) {
    return (
      'Voer een geldige datum in.'
    );
  }

  if (
    datum > getToday()
  ) {
    return (
      'De datum mag niet in de toekomst liggen.'
    );
  }

  return null;
};

const createEmptyFoto =
  (): FotoItem => ({
    beschrijving: '',
    file: null,
    previewUrl: '',
    genomenOp: null
  });

const createEmptyMateriaal = (
  tip:
    Materiaal['tip']
): Materiaal => ({
  tip,
  naam: '',
  aantal: 0,
  eenheid: ''
});

const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (
    typeof error ===
      'object' &&
    error !== null &&
    'response' in error
  ) {
    const axiosError =
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

    return (
      axiosError
        .response
        ?.data
        ?.message ??
      fallback
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return fallback;
};

export default function WerkorderForm({
  initialDetail,
  existingDraftId
}: WerkorderFormProps) {
  const navigate =
    useNavigate();

  const isEditMode =
    initialDetail !==
      undefined &&
    existingDraftId !==
      undefined;

  const [
    werkorder,
    setWerkorder
  ] =
    useState<
      WerkorderFormData
    >({
      werkorder_id:
        initialDetail
          ?.werkorder_id ??
        generateWerkorderId(),

      aankomsttijd:
        initialDetail
          ?.aankomsttijd ??
        '',

      eindtijd:
        initialDetail
          ?.eindtijd ??
        '',

      datum:
        initialDetail
          ?.datum ??
        getToday(),

      uitgevoerde_werkzaamheden:
        initialDetail
          ?.uitgevoerde_werkzaamheden ??
        '',

      status:
        initialDetail
          ?.status ??
        ''
    });

  const initialKlantMaterialen =
    initialDetail
      ?.materialen
      .filter(
        materiaal =>
          materiaal.tip ===
          'klant'
      ) ??
    [];

  const initialBedrijfMaterialen =
    initialDetail
      ?.materialen
      .filter(
        materiaal =>
          materiaal.tip ===
          'bedrijf'
      ) ??
    [];

  const initialVerkoopMaterialen =
    initialDetail
      ?.materialen
      .filter(
        materiaal =>
          materiaal.tip ===
          'verkoop'
      ) ??
    [];

  const [
    klantMaterialen,
    setKlantMaterialen
  ] =
    useState<
      Materiaal[]
    >(
      initialKlantMaterialen
        .length > 0
        ? initialKlantMaterialen
        : [
            createEmptyMateriaal(
              'klant'
            )
          ]
    );

  const [
    bedrijfMaterialen,
    setBedrijfMaterialen
  ] =
    useState<
      Materiaal[]
    >(
      initialBedrijfMaterialen
        .length > 0
        ? initialBedrijfMaterialen
        : [
            createEmptyMateriaal(
              'bedrijf'
            )
          ]
    );

  const [
    verkoopMaterialen,
    setVerkoopMaterialen
  ] =
    useState<
      Materiaal[]
    >(
      initialVerkoopMaterialen
        .length > 0
        ? initialVerkoopMaterialen
        : [
            createEmptyMateriaal(
              'verkoop'
            )
          ]
    );

  const [
    fotos,
    setFotos
  ] =
    useState<
      FotoItem[]
    >([
      createEmptyFoto()
    ]);

  const [
    savedFotoUrls,
    setSavedFotoUrls
  ] =
    useState<
      Record<
        number,
        string
      >
    >({});

  useEffect(() => {
    let cancelled =
      false;

    const createdUrls:
      string[] = [];

    const loadSavedFotos =
      async (): Promise<void> => {
        if (
          !initialDetail ||
          initialDetail
            .fotos
            .length === 0
        ) {
          setSavedFotoUrls(
            {}
          );

          return;
        }

        const urls:
          Record<
            number,
            string
          > = {};

        await Promise.all(
          initialDetail
            .fotos
            .map(
              async foto => {
                try {
                  const blob =
                    await getFotoBlob(
                      initialDetail.id,
                      foto.id
                    );

                  const objectUrl =
                    URL.createObjectURL(
                      blob
                    );

                  createdUrls.push(
                    objectUrl
                  );

                  urls[
                    foto.id
                  ] =
                    objectUrl;
                } catch {
                  // Een afzonderlijke foto
                  // mag de rest niet blokkeren.
                }
              }
            )
        );

        if (cancelled) {
          createdUrls
            .forEach(
              url =>
                URL
                  .revokeObjectURL(
                    url
                  )
            );

          return;
        }

        setSavedFotoUrls(
          urls
        );
      };

    void loadSavedFotos();

    return () => {
      cancelled =
        true;

      createdUrls
        .forEach(
          url =>
            URL
              .revokeObjectURL(
                url
              )
        );
    };
  }, [
    initialDetail
  ]);

  const [
    draftId,
    setDraftId
  ] =
    useState<
      number | null
    >(
      existingDraftId ??
      null
    );

  const draftIdRef =
    useRef<
      number | null
    >(
      existingDraftId ??
      null
    );

  const draftCreationPromiseRef =
    useRef<
      Promise<number> |
      null
    >(
      null
    );

  const changeVersionRef =
    useRef(0);

  const [
    hasUnsavedChanges,
    setHasUnsavedChanges
  ] =
    useState(false);

  const [
    autoSaveStatus,
    setAutoSaveStatus
  ] =
    useState<
      AutoSaveStatus
    >(
      'idle'
    );

  const [
    loading,
    setLoading
  ] =
    useState(false);

  const [
    savingDraft,
    setSavingDraft
  ] =
    useState(false);

  const [
    successMessage,
    setSuccessMessage
  ] =
    useState('');

  const [
    errorMessage,
    setErrorMessage
  ] =
    useState('');

  const markDirty =
    (): void => {
      changeVersionRef
        .current += 1;

      setHasUnsavedChanges(
        true
      );

      setAutoSaveStatus(
        'unsaved'
      );
    };

  const updateField = (
    field:
      keyof WerkorderFormData,

    value:
      string
  ): void => {
    /*
     * Extra directe controle
     * wanneer Datum wordt gewijzigd.
     */
    if (
      field === 'datum'
    ) {
      const dateError =
        getDateError(
          value
        );

      if (dateError) {
        setErrorMessage(
          dateError
        );
      } else {
        setErrorMessage(
          ''
        );
      }
    }

    setWerkorder(
      current => ({
        ...current,
        [field]:
          value
      })
    );

    markDirty();
  };

  const handleKlantMaterialenChange =
    (
      materialen:
        Materiaal[]
    ): void => {
      setKlantMaterialen(
        materialen
      );

      markDirty();
    };

  const handleBedrijfMaterialenChange =
    (
      materialen:
        Materiaal[]
    ): void => {
      setBedrijfMaterialen(
        materialen
      );

      markDirty();
    };

  const handleVerkoopMaterialenChange =
    (
      materialen:
        Materiaal[]
    ): void => {
      setVerkoopMaterialen(
        materialen
      );

      markDirty();
    };

  const getMaterialen =
    (): Materiaal[] => {
      return [
        ...klantMaterialen,
        ...bedrijfMaterialen,
        ...verkoopMaterialen
      ]
        .filter(
          materiaal =>
            materiaal
              .naam
              .trim() !==
            ''
        )
        .map(
          materiaal => ({
            tip:
              materiaal.tip,

            naam:
              materiaal
                .naam
                .trim(),

            aantal:
              Number(
                materiaal.aantal
              ),

            eenheid:
              materiaal
                .eenheid
                ?.trim() ||
              undefined
          })
        );
    };

  const getDraftPayload =
    (): UpdateDraftPayload => ({
      werkorder_id:
        werkorder
          .werkorder_id,

      aankomsttijd:
        werkorder
          .aankomsttijd ||
        null,

      eindtijd:
        werkorder
          .eindtijd ||
        null,

      datum:
        werkorder.datum,

      uitgevoerde_werkzaamheden:
        werkorder
          .uitgevoerde_werkzaamheden ||
        null,

      status:
        werkorder.status ||
        null
    });

  const assertValidDate =
    (): void => {
      const dateError =
        getDateError(
          werkorder.datum
        );

      if (dateError) {
        throw new Error(
          dateError
        );
      }
    };

  const ensureDraftExists =
    async (): Promise<number> => {
      /*
       * Ook bij een bestaand
       * concept eerst datum
       * controleren.
       */
      assertValidDate();

      if (
        draftIdRef.current !==
        null
      ) {
        return (
          draftIdRef.current
        );
      }

      if (
        draftCreationPromiseRef
          .current
      ) {
        return (
          draftCreationPromiseRef
            .current
        );
      }

      if (
        !werkorder
          .werkorder_id
          .trim()
      ) {
        throw new Error(
          'Het werkorder-ID is verplicht.'
        );
      }

      const createPromise =
        createDraft({
          werkorder_id:
            werkorder
              .werkorder_id,

          datum:
            werkorder
              .datum
        }).then(
          result => {
            draftIdRef
              .current =
              result.id;

            setDraftId(
              result.id
            );

            return result.id;
          }
        );

      draftCreationPromiseRef
        .current =
        createPromise;

      try {
        return (
          await createPromise
        );
      } finally {
        draftCreationPromiseRef
          .current =
          null;
      }
    };

  const saveDraftData =
    async (
      currentDraftId:
        number,

      payload:
        UpdateDraftPayload,

      materialen:
        Materiaal[]
    ): Promise<void> => {
      /*
       * Dit voorkomt dat
       * autosave een toekomstige
       * datum opslaat.
       */
      assertValidDate();

      await updateDraft(
        currentDraftId,
        payload
      );

      await updateDraftMaterialen(
        currentDraftId,
        materialen
      );
    };

  const performAutoSave =
    async (): Promise<void> => {
      if (
        !hasUnsavedChanges ||
        loading ||
        savingDraft
      ) {
        return;
      }

      const versionAtStart =
        changeVersionRef
          .current;

      const payload =
        getDraftPayload();

      const materialen =
        getMaterialen();

      try {
        /*
         * Invalid datum =
         * helemaal niets opslaan.
         */
        assertValidDate();

        setAutoSaveStatus(
          'saving'
        );

        const currentDraftId =
          await ensureDraftExists();

        await saveDraftData(
          currentDraftId,
          payload,
          materialen
        );

        if (
          changeVersionRef
            .current ===
          versionAtStart
        ) {
          setHasUnsavedChanges(
            false
          );

          setAutoSaveStatus(
            'saved'
          );
        } else {
          setAutoSaveStatus(
            'unsaved'
          );
        }
      } catch (
        error: unknown
      ) {
        setAutoSaveStatus(
          'error'
        );

        setErrorMessage(
          getErrorMessage(
            error,
            'Het concept kon niet automatisch worden opgeslagen.'
          )
        );
      }
    };

  useEffect(() => {
    if (
      !hasUnsavedChanges ||
      loading ||
      savingDraft
    ) {
      return;
    }

    const timeoutId =
      window.setTimeout(
        () => {
          void performAutoSave();
        },
        AUTO_SAVE_DELAY
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    werkorder,
    klantMaterialen,
    bedrijfMaterialen,
    verkoopMaterialen,
    hasUnsavedChanges,
    loading,
    savingDraft
  ]);

  const uploadPendingFotos =
    async (
      currentDraftId:
        number
    ): Promise<void> => {
      for (
        const foto
        of fotos
      ) {
        if (!foto.file) {
          continue;
        }

        await uploadFoto(
          currentDraftId,
          foto.file,
          foto.beschrijving,
          foto.genomenOp ??
            new Date()
              .toISOString()
        );
      }
    };

  const handleSaveDraft =
    async (): Promise<void> => {
      setErrorMessage('');
      setSuccessMessage('');

      const versionAtStart =
        changeVersionRef
          .current;

      const payload =
        getDraftPayload();

      const materialen =
        getMaterialen();

      try {
        assertValidDate();

        setSavingDraft(
          true
        );

        const currentDraftId =
          await ensureDraftExists();

        await saveDraftData(
          currentDraftId,
          payload,
          materialen
        );

        await uploadPendingFotos(
          currentDraftId
        );

        setFotos([
          createEmptyFoto()
        ]);

        if (
          changeVersionRef
            .current ===
          versionAtStart
        ) {
          setHasUnsavedChanges(
            false
          );

          setAutoSaveStatus(
            'saved'
          );
        }

        setSuccessMessage(
          'Concept succesvol opgeslagen.'
        );
      } catch (
        error: unknown
      ) {
        setAutoSaveStatus(
          'error'
        );

        setErrorMessage(
          getErrorMessage(
            error,
            'Het concept kon niet worden opgeslagen.'
          )
        );
      } finally {
        setSavingDraft(
          false
        );
      }
    };

  const validateCompletion =
    (): boolean => {
      if (
        !werkorder
          .aankomsttijd
      ) {
        setErrorMessage(
          'De aankomsttijd is verplicht.'
        );

        return false;
      }

      if (
        !werkorder
          .eindtijd
      ) {
        setErrorMessage(
          'De eindtijd is verplicht.'
        );

        return false;
      }

      const dateError =
        getDateError(
          werkorder.datum
        );

      if (dateError) {
        setErrorMessage(
          dateError
        );

        return false;
      }

      if (
        !werkorder
          .uitgevoerde_werkzaamheden
          .trim()
      ) {
        setErrorMessage(
          'De uitgevoerde werkzaamheden zijn verplicht.'
        );

        return false;
      }

      if (
        !werkorder.status
      ) {
        setErrorMessage(
          'De status van de werkorder is verplicht.'
        );

        return false;
      }

      return true;
    };

  const handleSubmit =
    async (
      event:
        React.FormEvent<
          HTMLFormElement
        >
    ): Promise<void> => {
      event.preventDefault();

      setErrorMessage('');
      setSuccessMessage('');

      if (
        !validateCompletion()
      ) {
        return;
      }

      const payload =
        getDraftPayload();

      const materialen =
        getMaterialen();

      try {
        assertValidDate();

        setLoading(
          true
        );

        const currentDraftId =
          await ensureDraftExists();

        await saveDraftData(
          currentDraftId,
          payload,
          materialen
        );

        await uploadPendingFotos(
          currentDraftId
        );

        await completeDraft(
          currentDraftId
        );

        setHasUnsavedChanges(
          false
        );

        navigate(
          `/admin/werkorders/${currentDraftId}`,
          {
            replace:
              true
          }
        );
      } catch (
        error: unknown
      ) {
        setErrorMessage(
          getErrorMessage(
            error,
            'De werkorder kon niet worden voltooid.'
          )
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  const isBusy =
    loading ||
    savingDraft;

  const renderAutoSaveStatus =
    (): React.ReactNode => {
      switch (
        autoSaveStatus
      ) {
        case 'unsaved':
          return (
            <span className="text-amber-700">
              Niet opgeslagen
            </span>
          );

        case 'saving':
          return (
            <span className="text-blue-700">
              Automatisch opslaan...
            </span>
          );

        case 'saved':
          return (
            <span className="text-green-700">
              Automatisch opgeslagen
            </span>
          );

        case 'error':
          return (
            <span className="text-red-700">
              Fout bij automatisch opslaan
            </span>
          );

        default:
          return null;
      }
    };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {
              isEditMode
                ? 'Concept werkorder bewerken'
                : 'Opleverformulier werkorder'
            }
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {
              isEditMode
                ? 'Ga verder met het eerder opgeslagen concept.'
                : 'Wijzigingen worden automatisch als concept opgeslagen.'
            }
          </p>
        </div>

        <Link
          to="/admin/werkorders"
          className="text-sm text-blue-600 hover:underline"
        >
          Naar werkorders
        </Link>
      </div>

      <div className="mb-4 min-h-6 text-sm">
        {
          renderAutoSaveStatus()
        }
      </div>

      {draftId !==
        null && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-sm">
          Concept-ID:{' '}
          {draftId}
        </div>
      )}

      {initialDetail &&
        initialDetail
          .fotos
          .length >
          0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Reeds opgeslagen foto&apos;s
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {
                initialDetail
                  .fotos
                  .map(
                    foto => (
                      <div
                        key={
                          foto.id
                        }
                      >
                        {savedFotoUrls[
                          foto.id
                        ] ? (
                          <img
                            src={
                              savedFotoUrls[
                                foto.id
                              ]
                            }
                            alt={
                              foto.beschrijving ??
                              'Werkorderfoto'
                            }
                            className="w-full h-28 object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-28 flex items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
                            Foto laden...
                          </div>
                        )}
                        
                        {foto.beschrijving && (
                          <p className="text-xs text-gray-500 mt-1">
                            {
                              foto.beschrijving
                            }
                          </p>
                        )}
                      </div>
                    )
                  )
              }
            </div>
          </div>
        )}

      <form
        onSubmit={
          handleSubmit
        }
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Werkorder-ID
          </label>

          <input
            type="text"
            value={
              werkorder
                .werkorder_id
            }
            readOnly
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-gray-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aankomsttijd
            </label>

            <input
              type="time"
              value={
                werkorder
                  .aankomsttijd
              }
              onChange={
                event =>
                  updateField(
                    'aankomsttijd',
                    event.target
                      .value
                  )
              }
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Eindtijd
            </label>

            <input
              type="time"
              value={
                werkorder
                  .eindtijd
              }
              onChange={
                event =>
                  updateField(
                    'eindtijd',
                    event.target
                      .value
                  )
              }
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datum
          </label>

          <input
            type="date"
            value={
              werkorder.datum
            }
            max={
              getToday()
            }
            onChange={
              event =>
                updateField(
                  'datum',
                  event.target
                    .value
                )
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <p className="mt-1 text-xs text-gray-500">
            De datum mag niet in de toekomst liggen.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Uitgevoerde werkzaamheden
          </label>

          <textarea
            value={
              werkorder
                .uitgevoerde_werkzaamheden
            }
            onChange={
              event =>
                updateField(
                  'uitgevoerde_werkzaamheden',
                  event.target
                    .value
                )
            }
            placeholder="Beschrijf hier de uitgevoerde werkzaamheden..."
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={4}
          />
        </div>

        <div className="mb-6 pb-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status van de werkorder
          </label>

          <select
            value={
              werkorder.status
            }
            onChange={
              event =>
                updateField(
                  'status',
                  event.target
                    .value
                )
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">
              Kies een status
            </option>

            <option value="Voltooid">
              Voltooid
            </option>

            <option value="Niet Voltooid">
              Niet voltooid
            </option>

            <option value="In Afwachting">
              In afwachting
            </option>
          </select>
        </div>

        <MateriaalSection
          title="Gebruikte materialen van de klant"
          tip="klant"
          placeholder="Materiaal"
          materialen={
            klantMaterialen
          }
          onChange={
            handleKlantMaterialenChange
          }
        />

        <MateriaalSection
          title="Geleverde goederen vanuit ons bedrijf"
          tip="bedrijf"
          placeholder="Materiaal"
          materialen={
            bedrijfMaterialen
          }
          onChange={
            handleBedrijfMaterialenChange
          }
        />

        <MateriaalSection
          title="Extra gebruikte materialen voor verkoop"
          tip="verkoop"
          placeholder="Materiaal"
          materialen={
            verkoopMaterialen
          }
          onChange={
            handleVerkoopMaterialenChange
          }
        />

        <FotoSection
          fotos={
            fotos
          }
          onChange={
            setFotos
          }
        />

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {
              errorMessage
            }
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">
            {
              successMessage
            }
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={
              isBusy
            }
            onClick={() =>
              void handleSaveDraft()
            }
            className="flex-1 border border-blue-600 text-blue-700 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 font-semibold py-3 rounded"
          >
            {
              savingDraft
                ? 'Concept opslaan...'
                : 'Concept opslaan'
            }
          </button>

          <button
            type="submit"
            disabled={
              isBusy
            }
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded"
          >
            {
              loading
                ? 'Werkorder voltooien...'
                : 'Werkorder voltooien'
            }
          </button>
        </div>
      </form>
    </div>
  );
}