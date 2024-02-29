import { Loader2Icon } from 'lucide-react';

function CommandFooter() {
  return (
    <div className="h-12 border-t">
      <Loader2Icon className="animate-spin" />
      <p></p>
    </div>
  );
}

export default CommandFooter;
