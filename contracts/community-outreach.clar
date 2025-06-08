;; Community Outreach Contract
;; This contract coordinates community outreach programs

;; Define data variables
(define-map outreach-programs uint {name: (string-ascii 100),
                                  description: (string-ascii 500),
                                  start-date: uint,
                                  end-date: uint,
                                  institution: principal,
                                  active: bool})
(define-map program-participants {program-id: uint, participant: principal} bool)
(define-map participant-count uint uint)
(define-data-var program-id-counter uint u0)
(define-data-var admin principal tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-PROGRAM-NOT-FOUND u101)
(define-constant ERR-ALREADY-PARTICIPATING u102)
(define-constant ERR-NOT-PARTICIPATING u103)
(define-constant ERR-PROGRAM-INACTIVE u104)

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin)))

;; Create a new outreach program
(define-public (create-program (name (string-ascii 100))
                              (description (string-ascii 500))
                              (start-date uint)
                              (end-date uint)
                              (institution principal))
  (let ((new-id (var-get program-id-counter)))
    (begin
      (asserts! (or (is-admin) (is-eq tx-sender institution)) (err ERR-NOT-AUTHORIZED))
      (map-set outreach-programs new-id {
        name: name,
        description: description,
        start-date: start-date,
        end-date: end-date,
        institution: institution,
        active: true
      })
      (map-set participant-count new-id u0)
      (var-set program-id-counter (+ new-id u1))
      (ok new-id))))

;; Update an outreach program
(define-public (update-program (program-id uint)
                              (name (string-ascii 100))
                              (description (string-ascii 500))
                              (start-date uint)
                              (end-date uint))
  (let ((program-data (map-get? outreach-programs program-id)))
    (begin
      (asserts! (is-some program-data) (err ERR-PROGRAM-NOT-FOUND))
      (asserts! (or (is-admin) (is-eq tx-sender (get institution (unwrap-panic program-data)))) (err ERR-NOT-AUTHORIZED))
      (map-set outreach-programs program-id (merge (unwrap-panic program-data) {
        name: name,
        description: description,
        start-date: start-date,
        end-date: end-date
      }))
      (ok true))))

;; End an outreach program
(define-public (end-program (program-id uint))
  (let ((program-data (map-get? outreach-programs program-id)))
    (begin
      (asserts! (is-some program-data) (err ERR-PROGRAM-NOT-FOUND))
      (asserts! (or (is-admin) (is-eq tx-sender (get institution (unwrap-panic program-data)))) (err ERR-NOT-AUTHORIZED))
      (map-set outreach-programs program-id (merge (unwrap-panic program-data) {active: false}))
      (ok true))))

;; Join an outreach program
(define-public (join-program (program-id uint))
  (let ((program-data (map-get? outreach-programs program-id))
        (current-count (default-to u0 (map-get? participant-count program-id))))
    (begin
      (asserts! (is-some program-data) (err ERR-PROGRAM-NOT-FOUND))
      (asserts! (get active (unwrap-panic program-data)) (err ERR-PROGRAM-INACTIVE))
      (asserts! (is-none (map-get? program-participants {program-id: program-id, participant: tx-sender})) (err ERR-ALREADY-PARTICIPATING))
      (map-set program-participants {program-id: program-id, participant: tx-sender} true)
      (map-set participant-count program-id (+ current-count u1))
      (ok true))))

;; Leave an outreach program
(define-public (leave-program (program-id uint))
  (let ((program-data (map-get? outreach-programs program-id))
        (current-count (default-to u0 (map-get? participant-count program-id))))
    (begin
      (asserts! (is-some program-data) (err ERR-PROGRAM-NOT-FOUND))
      (asserts! (is-some (map-get? program-participants {program-id: program-id, participant: tx-sender})) (err ERR-NOT-PARTICIPATING))
      (map-delete program-participants {program-id: program-id, participant: tx-sender})
      (map-set participant-count program-id (- current-count u1))
      (ok true))))

;; Get program details
(define-read-only (get-program-details (program-id uint))
  (map-get? outreach-programs program-id))

;; Check if a user is participating in a program
(define-read-only (is-participating-in-program (program-id uint) (participant principal))
  (default-to false (map-get? program-participants {program-id: program-id, participant: participant})))

;; Get participant count for a program
(define-read-only (get-participant-count (program-id uint))
  (default-to u0 (map-get? participant-count program-id)))

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set admin new-admin)
    (ok true)))
