type MultipleOptionType = {
  cancelMultipleOption: () => void;
  iterateOptions: () => void;
};
export default function MultipleOption({
  cancelMultipleOption,
  iterateOptions,
}: MultipleOptionType) {
  return (
    <div className="bg-white my-4 px-4 pb-4 pt-4 sm:p-6 sm:pb-4 w-2/4 mx-auto rounded-md">
      <div className="sm:flex sm:items-start">
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <div className="mt-2 flex flex-row justify-center">
            <p className="text-sm text-gray-500 basis-3/4 ">
              You have selected multiple objects. Click on next button below to
              iterate over the elements.
            </p>
            <div className="border-l mx-2 h-10"></div>
            <span className="basis-1/8 mr-2 flex justify-center">
              <button type="button" onClick={iterateOptions}>
                <img
                  className="h-6 w-6"
                  src="/public/play-button.png"
                  alt="Description of the image"
                />
                <span className="sr-only">Icon description</span>
              </button>
            </span>
            <span className="basis-1/8 flex justify-center">
              <button type="button" onClick={cancelMultipleOption}>
                <img
                  className="h-7 w-7"
                  src="/public/cancel.png"
                  alt="Description of the image"
                />
                <span className="sr-only">Icon description</span>
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
