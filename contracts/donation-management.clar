;; Donation Management Contract
;; This contract manages religious donations and tithes

;; Define data variables
(define-map donations uint {donor: principal,
                           institution: principal,
                           amount: uint,
                           purpose: (string-ascii 100),
                           timestamp: uint})
(define-map institution-donations principal uint)
(define-map donor-donations principal uint)
(define-data-var donation-id-counter uint u0)
(define-data-var admin principal tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-DONATION-NOT-FOUND u101)
(define-constant ERR-INSUFFICIENT-FUNDS u102)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin)))

;; Make a donation
(define-public (make-donation (institution principal) (amount uint) (purpose (string-ascii 100)))
  (let ((new-id (var-get donation-id-counter))
        (institution-total (default-to u0 (map-get? institution-donations institution)))
        (donor-total (default-to u0 (map-get? donor-donations tx-sender))))
    (begin
      (asserts! (>= (stx-get-balance tx-sender) amount) (err ERR-INSUFFICIENT-FUNDS))
      (try! (stx-transfer? amount tx-sender institution))
      (map-set donations new-id {
        donor: tx-sender,
        institution: institution,
        amount: amount,
        purpose: purpose,
        timestamp: block-height
      })
      (map-set institution-donations institution (+ institution-total amount))
      (map-set donor-donations tx-sender (+ donor-total amount))
      (var-set donation-id-counter (+ new-id u1))
      (ok new-id))))

;; Get donation details
(define-read-only (get-donation-details (donation-id uint))
  (map-get? donations donation-id))

;; Get total donations for an institution
(define-read-only (get-institution-total (institution principal))
  (default-to u0 (map-get? institution-donations institution)))

;; Get total donations from a donor
(define-read-only (get-donor-total (donor principal))
  (default-to u0 (map-get? donor-donations donor)))

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set admin new-admin)
    (ok true)))
