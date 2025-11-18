/**
 * Testy jednostkowe dla lib/messageRepository.js
 *
 * Sprawdzamy:
 * - Pobieranie wszystkich wiadomości
 * - Dodawanie nowych wiadomości
 * - Czyszczenie historii
 * - Walidację danych wiadomości
 */

const {
  getAllMessages,
  addMessage,
  clearAllMessages,
  addAttachment
} = require('../../lib/messageRepository');

describe('messageRepository', () => {
  // Przed każdym testem wyczyść historię
  beforeEach(() => {
    clearAllMessages();
  });

  describe('getAllMessages', () => {
    it('powinno zwrócić pustą tablicę na początku', () => {
      const messages = getAllMessages();

      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toHaveLength(0);
    });

    it('powinno zwrócić wszystkie dodane wiadomości', () => {
      // Dodaj kilka wiadomości
      addMessage({
        userId: 'mama',
        userName: 'Mama',
        text: 'Pierwsza wiadomość'
      });
      addMessage({
        userId: 'tata',
        userName: 'Tata',
        text: 'Druga wiadomość'
      });

      const messages = getAllMessages();

      expect(messages).toHaveLength(2);
      expect(messages[0].text).toBe('Pierwsza wiadomość');
      expect(messages[1].text).toBe('Druga wiadomość');
    });
  });

  describe('addMessage', () => {
    it('powinno dodać wiadomość z wszystkimi wymaganymi polami', () => {
      const message = addMessage({
        userId: 'mama',
        userName: 'Mama',
        text: 'Test wiadomości'
      });

      expect(message).toBeDefined();
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('userId', 'mama');
      expect(message).toHaveProperty('userName', 'Mama');
      expect(message).toHaveProperty('text', 'Test wiadomości');
      expect(message).toHaveProperty('createdAt');
    });

    it('powinno wygenerować unikalny ID', () => {
      const msg1 = addMessage({
        userId: 'mama',
        userName: 'Mama',
        text: 'Pierwsza'
      });
      const msg2 = addMessage({
        userId: 'mama',
        userName: 'Mama',
        text: 'Druga'
      });

      expect(msg1.id).toBeDefined();
      expect(msg2.id).toBeDefined();
      expect(msg1.id).not.toBe(msg2.id);
    });

    it('powinno dodać timestamp w formacie ISO', () => {
      const message = addMessage({
        userId: 'mama',
        userName: 'Mama',
        text: 'Test'
      });

      expect(message.createdAt).toBeDefined();
      expect(typeof message.createdAt).toBe('string');

      // Sprawdź, czy to poprawny format ISO
      const date = new Date(message.createdAt);
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('powinno usunąć białe znaki z początku i końca tekstu', () => {
      const message = addMessage({
        userId: 'mama',
        userName: 'Mama',
        text: '  Tekst z białymi znakami  '
      });

      expect(message.text).toBe('Tekst z białymi znakami');
    });

    it('powinno rzucić błąd przy braku userId', () => {
      expect(() => {
        addMessage({
          userName: 'Mama',
          text: 'Test'
        });
      }).toThrow('Nieprawidłowa struktura wiadomości');
    });

    it('powinno rzucić błąd przy braku userName', () => {
      expect(() => {
        addMessage({
          userId: 'mama',
          text: 'Test'
        });
      }).toThrow('Nieprawidłowa struktura wiadomości');
    });

    it('powinno rzucić błąd przy braku text i attachmentId', () => {
      expect(() => {
        addMessage({
          userId: 'mama',
          userName: 'Mama'
        });
      }).toThrow('Wiadomość musi zawierać tekst lub załącznik');
    });

    it('powinno dodać wiadomość z obrazkiem bez tekstu', () => {
      // Najpierw dodaj załącznik
      const attachment = addAttachment({
        filename: 'test-image.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024
      });

      const message = addMessage({
        userId: 'mama',
        userName: 'Mama',
        text: '',
        attachmentId: attachment.id
      });

      expect(message).toBeDefined();
      expect(message.attachmentId).toBe(attachment.id);
    });

    it('powinno dodać wiadomość do historii', () => {
      expect(getAllMessages()).toHaveLength(0);

      addMessage({
        userId: 'mama',
        userName: 'Mama',
        text: 'Test'
      });

      expect(getAllMessages()).toHaveLength(1);
    });

    it('powinno zachować kolejność wiadomości', () => {
      addMessage({ userId: '1', userName: 'User1', text: 'Pierwsza' });
      addMessage({ userId: '2', userName: 'User2', text: 'Druga' });
      addMessage({ userId: '3', userName: 'User3', text: 'Trzecia' });

      const messages = getAllMessages();

      expect(messages[0].text).toBe('Pierwsza');
      expect(messages[1].text).toBe('Druga');
      expect(messages[2].text).toBe('Trzecia');
    });
  });

  describe('clearAllMessages', () => {
    it('powinno wyczyścić całą historię wiadomości', () => {
      // Dodaj kilka wiadomości
      addMessage({ userId: '1', userName: 'User1', text: 'Test 1' });
      addMessage({ userId: '2', userName: 'User2', text: 'Test 2' });
      addMessage({ userId: '3', userName: 'User3', text: 'Test 3' });

      expect(getAllMessages()).toHaveLength(3);

      clearAllMessages();

      expect(getAllMessages()).toHaveLength(0);
    });

    it('powinno pozwolić na dodanie nowych wiadomości po czyszczeniu', () => {
      addMessage({ userId: '1', userName: 'User1', text: 'Przed' });
      clearAllMessages();
      addMessage({ userId: '2', userName: 'User2', text: 'Po' });

      const messages = getAllMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe('Po');
    });
  });

  describe('Przechowywanie wiadomości', () => {
    it('powinno przechowywać wszystkie wiadomości (retencja oparta na dacie)', () => {
      // Dodaj 100 wiadomości
      for (let i = 0; i < 100; i++) {
        addMessage({
          userId: 'test',
          userName: 'Test',
          text: `Wiadomość ${i}`
        });
      }

      const messages = getAllMessages();

      // Wszystkie wiadomości powinny być przechowywane
      // (usuwanie oparte na dacie, nie na liczbie)
      expect(messages.length).toBe(100);
      expect(messages[0].text).toBe('Wiadomość 0');
      expect(messages[messages.length - 1].text).toBe('Wiadomość 99');
    });
  });
});
