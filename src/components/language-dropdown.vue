<template>
  <div>
    <div class="mt-1 relative">
      <button
        type="button"
        class="
          relative
          w-full
          bg-gray-100
          dark:bg-gray-800
          rounded-md
          pl-3
          pr-10
          py-2
          text-left
          cursor-default
          focus:outline-none
          focus:ring-2 focus:ring-bright-pink
          focus:border-bright-pink
          sm:text-sm
        "
        aria-haspopup="listbox"
        aria-expanded="true"
        aria-labelledby="listbox-label"
        @click="open = !open"
      >
        <span class="block truncate">{{ languages[language].title }}</span>
        <span
          class="
            absolute
            inset-y-0
            right-0
            flex
            items-center
            pr-2
            pointer-events-none
          "
        >
          <DropdownIcon />
        </span>
      </button>
      <ul
        class="
          absolute
          z-10
          mt-1
          w-full
          bg-gray-100
          dark:bg-gray-800
          shadow-lg
          max-h-60
          rounded-md
          py-1
          text-base
          ring-1 ring-black ring-opacity-5
          overflow-auto
          focus:outline-none
          sm:text-sm
        "
        style="
          margin-left: 0 !important;
          margin-right: 0 !important;
          margin-top: 0.25rem !important;
        "
        tabindex="-1"
        role="listbox"
        aria-labelledby="listbox-label"
        aria-activedescendant="listbox-option-3"
        v-if="open"
      >
        <template v-for="(lang, index) in languages">
          <li
            class="cursor-default select-none relative py-2 pl-8 pr-4"
            id="listbox-option-0"
            role="option"
            :key="index"
            @click="_handleLanguageChange(lang)"
          >
            <span class="font-normal block truncate">{{ lang.title }} </span>
            <span
              class="
                text-bright-pink
                absolute
                inset-y-0
                left-0
                flex
                items-center
                pl-1.5
              "
              v-if="selected === index"
            >
              <TickIcon />
            </span>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script>
import TickIcon from '@/assets/icons/tick.svg'
import DropdownIcon from '@/assets/icons/dropdown.svg'
import { DateTime } from 'luxon'
import { loadLocaleMessages } from '@/i18n'
import { mapActions, mapGetters } from 'vuex'
import { Actions as CalendarActions } from '@/store/modules/calendar/types'
import {
  Actions as AppActions,
  Getters as AppGetters
} from '@/store/modules/app/types'

export default {
  data() {
    return {
      open: false,
      selected: localStorage.lang,
      language: (this.$i18n.locale = localStorage.lang || 'en-US'),
      languages: loadLocaleMessages()
    }
  },
  methods: {
    ...mapActions('calendar', [CalendarActions.SET_CURRENT_WEEK]),
    ...mapActions('app', [AppActions.SET_LANGUAGE]),

    _handleLanguageChange(lang) {
      /**
       * TODO / FIXME, should not need to use localStorage
       * current use of formatDate() and other INTL methods require it since store is not available
       */

      if (this.$i18n.locale === lang.code) return

      this.selected = lang.code
      this.language = lang.code
      this.open = false
      this.$i18n.locale = lang.code
      localStorage.lang = lang.code

      this.setCurrentWeek()
      DateTime.local().setLocale(lang.code)
    }
  },
  computed: {
    ...mapGetters('app', [AppGetters.GET_LANGUAGE])
  },
  components: {
    TickIcon,
    DropdownIcon
  }
}
</script>
