namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $bookingData;

    public function __construct($bookingData)
    {
        $this->bookingData = $bookingData;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Xác nhận đặt phòng tại Hoàng Lan Viên FarmStay',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booking_confirmation', // Đường dẫn file giao diện email
        );
    }
}