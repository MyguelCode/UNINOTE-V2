// === DATE PICKER MODAL - UNINOTE ===

export class DatePickerModal {
  static show(currentDate = null) {
    return new Promise(resolve => {
      console.log('DatePickerModal: Usando versión legacy');
      resolve(null);
    });
  }
}
