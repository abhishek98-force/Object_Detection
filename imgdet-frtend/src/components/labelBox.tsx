import { Dialog, Input } from '@headlessui/react';
import { FC, useState } from 'react';
import clsx from 'clsx';

type LabelBoxProps = {
  openDialog: boolean;
  changeOpenValue: (value: boolean) => void;
  handleSubmit: (value: string) => void;
};

const labelBox: FC<LabelBoxProps> = ({
  openDialog,
  changeOpenValue,
  handleSubmit,
}) => {
  const [label, setLabel] = useState('');
  console.log('function is', changeOpenValue);
  return (
    <div>
      <Dialog
        as="div"
        open={openDialog}
        className="relative z-10"
        onClose={() => changeOpenValue(false)}
      >
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-200 p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title
                as="h3"
                className="text-lg text-center font-medium leading-6 text-gray-900"
              >
                Enter Label
              </Dialog.Title>
              <div className="my-10 flex justify-center">
                <p className="text-sm text-gray-500">
                  <Input
                    type="text"
                    value={label}
                    className={clsx('p-2')}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="rounded-md border border-transparent bg-blue-100 px-4 py-2 mr-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  onClick={() => {
                    setLabel('');
                    handleSubmit(label);
                  }}
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  onClick={() => changeOpenValue(false)}
                >
                  Close
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default labelBox;
