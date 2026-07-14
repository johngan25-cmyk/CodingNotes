
/*

  ToastBanner Component
  A stateless presentation layer that renders floating, self-dismissing 
  notification banners (errors or success confirmations) at the top of the viewport.
  Uses pointer-events configurations to prevent UI layout interaction blockages.

*/

export default function ToastBanner({ error, success }) {
  if (!error && !success) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none items-center">
      {error && (
        <div className="bg-red-600 text-white shadow-xl rounded-xl px-4 py-3 text-xs font-medium pointer-events-auto">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-600 text-white shadow-xl rounded-xl px-4 py-3 text-xs font-medium pointer-events-auto">
          {success}
        </div>
      )}
    </div>
  );
}